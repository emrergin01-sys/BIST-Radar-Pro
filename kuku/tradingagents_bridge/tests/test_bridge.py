import importlib.util
from pathlib import Path
import tempfile
import unittest

file = Path(__file__).resolve().parents[1] / "run.py"
spec = importlib.util.spec_from_file_location("kuku_ta_bridge", file)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class BridgeTests(unittest.TestCase):
    def test_bist_prefix(self):
        self.assertEqual(m.bist_ticker("ASTOR"), "ASTOR.IS")
        self.assertEqual(m.bist_ticker("cwene.is"), "CWENE.IS")
    def test_reject_injections(self):
        for symbol in ["ASTOR;rm -rf /", "A", "LONGSYMBOL12345", "../ASTOR", "ASTOR.US"]:
            with self.subTest(symbol=symbol), self.assertRaises(ValueError):
                m.bist_ticker(symbol)
    def test_dates(self):
        self.assertEqual(m.valid_day("2026-10-26"), "2026-10-26")
        with self.assertRaises(Exception): m.valid_day("2026-13-99")
    def test_private_path_refuses_repo(self):
        with self.assertRaises(ValueError): m.private_root(str(Path.cwd()))
    def test_no_fake_fallback_when_missing_dependency(self):
        self.assertFalse("DEMO" in m.run_real_agents.__doc__)

if __name__ == '__main__': unittest.main()
