import tempfile
import unittest
from pathlib import Path

from server import Store, profile


class Rooms(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name)/"rooms.sqlite3"
        self.store = Store(self.path)
        self.a,_,self.token = self.store.session(None)
        self.b,_,_ = self.store.session(None)
        self.room = self.store.join(self.a,{"name":"Alice"})
        self.code = self.room["id"]

    def tearDown(self): self.temp.cleanup()

    def action(self,sid,action,**extra):
        room = self.store.room(sid,self.code)
        return self.store.action(sid,self.code,{"action":action,"rev":room["rev"],"request_id":"request_"+str(room["rev"]),**extra})

    def test_host_and_capacity(self):
        self.store.join(self.b,{"name":"Bob","room":self.code})
        with self.assertRaisesRegex(ValueError,"host"):
            self.action(self.b,"start")
        for i in range(6):
            sid,_,_ = self.store.session(None)
            self.store.join(sid,{"name":str(i),"room":self.code})
        sid,_,_ = self.store.session(None)
        with self.assertRaisesRegex(ValueError,"full"):
            self.store.join(sid,{"name":"Extra","room":self.code})
        self.assertEqual(len(self.store.room(self.a,self.code)["players"]),8)
        next_room = self.store.join(sid,{"name":"Extra"})
        self.assertNotEqual(next_room["id"],self.code)

    def test_private_racks_and_persistence(self):
        self.store.join(self.b,{"name":"Bob","room":self.code})
        self.action(self.a,"settings",settings={"language":"en","random_first":False})
        room = self.action(self.a,"start")
        self.assertEqual(len(room["rack"]),7)
        self.assertNotIn("bag",room)
        self.assertTrue(all("rack" not in p and "sid" not in p for p in room["players"]))
        self.assertNotIn("rack",self.store.room("outsider",self.code))
        other = Store(self.path)
        sid,person,token = other.session(self.token)
        self.assertEqual(sid,self.a)
        self.assertIsNone(token)
        self.assertEqual(person["name"],"Alice")
        self.assertEqual(other.room(sid,self.code)["rack"],room["rack"])

    def test_stale_requests_and_retry(self):
        room = self.store.join(self.b,{"name":"Bob","room":self.code})
        self.action(self.a,"settings",settings={"language":"en","random_first":False})
        with self.assertRaisesRegex(ValueError,"changed"):
            self.store.action(self.a,self.code,{"action":"start","rev":room["rev"],"request_id":"abcdefgh"})
        room = self.action(self.a,"start")
        data = {"action":"pass","rev":room["rev"],"request_id":"duplicate_123"}
        first = self.store.action(self.a,self.code,data)
        second = self.store.action(self.a,self.code,data)
        self.assertEqual(first["rev"],second["rev"])
        self.assertEqual(len(second["history"]),1)
        with self.assertRaisesRegex(ValueError,"turn"):
            self.action(self.a,"pass")

    def test_leave_transfers_host(self):
        room = self.store.join(self.b,{"name":"Bob","room":self.code})
        bob = room["me"]
        self.action(self.a,"leave")
        room = self.store.room(self.b,self.code)
        self.assertEqual(room["host"],bob)
        self.assertEqual(len(room["players"]),1)

    def test_profile_input(self):
        for data in ({"name":""},{"name":"A","avatar":"https://example.com/a.png"},{"name":"A","avatar":"data:image/png;base64,YWJj"}):
            with self.assertRaises(ValueError): profile(data)


if __name__ == "__main__": unittest.main()
