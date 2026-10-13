import copy
import unittest
from collections import Counter

import game
import definitions


def fixture(language="en"):
    room = {"settings": {**game.DEFAULT_SETTINGS,"language":language,"random_first":False},
            "players": [{"id":"a","name":"Alice"},{"id":"b","name":"Bob"}]}
    game.start(room,0)
    return room,room["players"][0]


def rack(player,letters,language="en"):
    player["rack"] = [{"id":str(i),"letter":c,"points":dict(zip(game.ALPHABETS[language],game.TILES[language]))[c][1]}
                      for i,c in enumerate(letters)]


def placements(letters,positions):
    return [{"id":str(i),"pos":p,"letter":c} for i,(c,p) in enumerate(zip(letters,positions))]


class Rules(unittest.TestCase):
    def test_spanish_definitions(self):
        self.assertEqual(definitions.normalized("año"),"AÑO")
        self.assertEqual(definitions.normalized("ano"),"ANO")
        self.assertEqual(definitions.normalized("árbol"),"ARBOL")
        parser = definitions.Senses(definition_list=True)
        parser.feed('<dl><dt>1 Sustantivo</dt><dd>Edificación destinada a <a>vivienda</a>.'
                    '<dl><dd>Ejemplo que no forma parte de la definición.</dd></dl></dd>'
                    '<dd>Nota que tampoco forma parte.</dd></dl>')
        self.assertEqual(parser.senses,["Edificación destinada a vivienda."])

    def test_spanish_tiles_words_and_digraphs(self):
        bag = game.tile_bag("es")
        self.assertEqual(len(bag),100)
        self.assertEqual(len({t["id"] for t in bag}),100)
        self.assertEqual({t["letter"] for t in bag},set(game.ALPHABETS["es"]))
        self.assertEqual(Counter(t["letter"] for t in bag)["Ñ"],1)
        self.assertEqual(len(game.WORDS["es"]),639293)
        for word in ("AÑO","CHICO","CALLE","PERRO","ABABILLARA","ABABILLARAIS","ABARQUILLAMIENTO"):
            self.assertTrue(word in game.WORDS["es"],word)
        self.assertGreater(len("ABARQUILLAMIENTO"),15)
        self.assertLessEqual(len(game.word_tiles("ABARQUILLAMIENTO","es")),15)
        room,p = fixture("es")
        rack(p,["CH","I","C","O"],"es")
        move = game.validate(room,p,placements(["CH","I","C","O"],[111,112,113,114]))
        self.assertEqual(move["words"][0]["word"],"CHICO")
        self.assertEqual(move["score"],20)
        rack(p,list("CHICO"),"es")
        with self.assertRaisesRegex(ValueError,"one tile"):
            game.validate(room,p,placements("CHICO",[110,111,112,113,114]))
        rack(p,["C","A","L","L","E"],"es")
        with self.assertRaisesRegex(ValueError,"one tile"):
            game.validate(room,p,placements("CALLE",[110,111,112,113,114]))
        rack(p,["P","E","R","R","O"],"es")
        with self.assertRaisesRegex(ValueError,"one tile"):
            game.validate(room,p,placements("PERRO",[110,111,112,113,114]))
        rack(p,["?","I","C","O"],"es")
        move = game.validate(room,p,placements(["CH","I","C","O"],[111,112,113,114]))
        self.assertEqual(move["score"],10)
        for invalid in ("K","W","?"):
            with self.assertRaisesRegex(ValueError,"blank"):
                game.validate(room,p,placements([invalid,"I","C","O"],[111,112,113,114]))
        rack(p,["A","Ñ","O"],"es")
        self.assertEqual(game.validate(room,p,placements(["A","Ñ","O"],[111,112,113]))["score"],20)

    def test_board_and_bags(self):
        self.assertEqual(Counter(game.PREMIUMS.values()),{"TW":8,"DW":17,"TL":12,"DL":24})
        for pos,premium in game.PREMIUMS.items():
            self.assertEqual(game.PREMIUMS[224-pos],premium)
        self.assertEqual(len(game.tile_bag("fr")),102)
        self.assertEqual(len(game.tile_bag("en")),100)
        self.assertEqual(len({t["id"] for t in game.tile_bag("fr")}),102)
        self.assertEqual(dict(zip(game.LETTERS,game.TILES["fr"]))["K"],(1,10))
        self.assertEqual(dict(zip(game.LETTERS,game.TILES["en"]))["K"],(1,5))

    def test_dictionary_counts_and_new_words(self):
        self.assertEqual(len(game.WORDS["fr"]),407128)
        self.assertEqual(len(game.WORDS["en"]),280887)
        for word in ("QI","AA","CHAT","DECONFINEMENT","IEL","IELS"):
            self.assertIn(word,game.WORDS["fr"])
        for word in ("QI","ZA","AA","YEET","YEETED","BRUV"):
            self.assertIn(word,game.WORDS["en"])
        self.assertNotIn("ZZZZZZZ",game.WORDS["en"])

    def test_first_word_and_atomic_reject(self):
        room,p = fixture()
        rack(p,"CAT")
        p["revealed"] = True
        room["players"][1]["revealed"] = True
        self.assertEqual(game.validate(room,p,placements("CAT",[111,112,113]))["score"],10)
        before = copy.deepcopy(room)
        with self.assertRaisesRegex(ValueError,"centre"):
            game.play(room,p,placements("CAT",[1,2,3]))
        self.assertEqual(room,before)
        game.play(room,p,placements("CAT",[111,112,113]),0)
        self.assertEqual(p["score"],10)
        self.assertEqual(room["turn"],"b")
        self.assertTrue(all(not p["revealed"] for p in room["players"]))

    def test_geometry_and_inventory(self):
        room,p = fixture()
        rack(p,"CAT")
        for move,message in [(placements("CAT",[111,112,114]),"gaps"),
                             (placements("CAT",[111,112,128]),"one row"),
                             (placements("CAT",[112,112,113]),"occupied"),
                             ([{"id":"0","pos":112},{"id":"0","pos":113}],"available"),
                             ([{"id":"0","pos":True}],"inside")]:
            with self.assertRaisesRegex(ValueError,message): game.validate(room,p,move)

    def test_crosswords_and_reused_premiums(self):
        room,p = fixture()
        rack(p,"CAT")
        game.play(room,p,placements("CAT",[111,112,113]),0)
        q = room["players"][1]
        rack(q,"R")
        move = game.validate(room,q,placements("R",[127]))
        self.assertEqual(move["words"][0]["word"],"AR")
        self.assertEqual(move["score"],2)  # The centre multiplier was already spent.
        rack(q,"ZZ")
        before = copy.deepcopy(room)
        with self.assertRaisesRegex(ValueError,"Not in"):
            game.play(room,q,placements("ZZ",[126,127]))
        self.assertEqual(room,before)
        rack(q,"AT")
        with self.assertRaisesRegex(ValueError,"Connect"):
            game.validate(room,q,placements("AT",[15,16]))

    def test_blank_and_bingo(self):
        room,p = fixture()
        rack(p,"?AT")
        move = game.validate(room,p,placements("CAT",[111,112,113]))
        self.assertEqual(move["score"],4)
        self.assertTrue(move["placed"][111]["blank"])
        self.assertEqual(move["placed"][111]["points"],0)
        with self.assertRaisesRegex(ValueError,"blank"):
            game.validate(room,p,[{"id":"0","pos":112}])
        rack(p,"RETAINS")
        move = game.validate(room,p,placements("RETAINS",range(109,116)))
        self.assertEqual(move["bonus"],50)
        self.assertEqual(move["score"],64)  # Seven points, centre DW, and bonus.

    def test_word_does_not_wrap(self):
        room,p = fixture()
        room["board"][14] = {"letter":"A","points":1}
        room["board"][15] = {"letter":"T","points":1}
        self.assertEqual(game.word_cells(room["board"],14,1),[14])

    def test_main_and_cross_word_score(self):
        room,p = fixture()
        room["board"][111] = {"letter":"A","points":1}
        room["board"][112] = {"letter":"A","points":1}
        rack(p,"AT")
        result = game.validate(room,p,placements("AT",[126,127]))
        self.assertEqual([w["word"] for w in result["words"]],["AT","AA","AT"])
        self.assertEqual(result["score"],8)  # New A covers DL in both words.
        room["board"][112] = {"letter":"C","points":3}
        with self.assertRaisesRegex(ValueError,"CT"):
            game.validate(room,p,placements("AT",[126,127]))

    def test_multiple_word_multipliers(self):
        room,p = fixture()
        for pos,c in zip([1,2,3,4,5,6],"EATING"):
            room["board"][pos] = {"letter":c,"points":1}
        rack(p,"SS")
        result = game.validate(room,p,placements("SS",[0,7]))
        self.assertEqual(result["words"][0]["word"],"SEATINGS")
        self.assertEqual(result["score"],72)

    def test_exchange_conserves_and_does_not_redraw_returned_tiles(self):
        room,p = fixture()
        before = Counter(t["id"] for t in room["bag"]+sum([p["rack"] for p in room["players"]],[]))
        ids = [t["id"] for t in p["rack"]]
        game.exchange(room,p,ids,0)
        self.assertFalse(set(ids)&{t["id"] for t in p["rack"]})
        self.assertEqual(before,Counter(t["id"] for t in room["bag"]+sum([p["rack"] for p in room["players"]],[])))
        room["bag"] = room["bag"][:6]
        with self.assertRaisesRegex(ValueError,"seven"):
            game.exchange(room,room["players"][1],[room["players"][1]["rack"][0]["id"]])

    def test_finish_and_pass_limit(self):
        room,p = fixture()
        rack(p,"AT")
        rack(room["players"][1],"QZ")
        room["bag"] = []
        game.play(room,p,placements("AT",[112,113]),0)
        self.assertEqual(room["status"],"finished")
        self.assertEqual(p["score"],24)
        self.assertEqual(room["players"][1]["score"],-20)
        room,p = fixture()
        for _ in range(6): game.pass_turn(room,game.current(room),0)
        self.assertEqual(room["status"],"finished")

    def test_clocks_continue_offline(self):
        room,p = fixture()
        room["settings"]["turn_seconds"] = 30
        self.assertTrue(game.tick(room,65))
        self.assertEqual(room["turn"],"a")
        self.assertEqual(room["passes"],2)
        self.assertEqual(room["turn_started"],60)
        room,p = fixture()
        room["settings"]["minutes"] = 5
        p["seconds"] = 5
        room["players"][1]["seconds"] = 100
        game.tick(room,6)
        self.assertTrue(p["resigned"])
        self.assertEqual(room["status"],"finished")


if __name__ == "__main__": unittest.main()
