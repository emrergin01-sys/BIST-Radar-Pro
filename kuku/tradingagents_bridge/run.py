#!/usr/bin/env python3
"""Direct, *real* TradingAgents v0.7.x engine bridge for BIST Radar Pro.

No synthetic data; never submits orders; stores reports outside the public repo.
The underlying package must be separately installed and a model session authorized.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from copy import deepcopy
from datetime import date, datetime
from pathlib import Path

_SYMBOL = re.compile(r"^[A-Z0-9]{3,8}(?:\.IS)?$")


def bist_ticker(raw: str) -> str:
    ticker = raw.strip().upper()
    if not _SYMBOL.fullmatch(ticker):
        raise ValueError("BIST için 3-8 harf/rakam veya .IS uzantılı sembol gerekli")
    return ticker if ticker.endswith(".IS") else ticker + ".IS"


def valid_day(raw: str) -> str:
    try:
        if date.fromisoformat(raw).isoformat() != raw:
            raise ValueError()
    except ValueError:
        raise argparse.ArgumentTypeError("Tarih YYYY-AA-GG olmalı")
    if raw > date.today().isoformat():
        raise argparse.ArgumentTypeError("Gelecek tarih analizine izin verilmez")
    return raw


def private_root(raw: str | None) -> Path:
    root = Path(raw).expanduser() if raw else Path.home() / "KUKU_PRIVATE" / "tradingagents"
    resolved = root.resolve()
    # Explicitly prevent accidentally putting private reports into checkout.
    cwd = Path.cwd().resolve()
    if resolved == cwd or cwd in resolved.parents:
        raise ValueError("Özel rapor klasörü herkese açık kod deposunun içinde olamaz")
    return resolved


def vendor_healthcheck(ticker: str) -> dict:
    """Use the real yfinance source, never hard-code a price."""
    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("TradingAgents/yfinance kurulu değil. Kurulum rehberine bak.") from exc
    history = yf.Ticker(ticker).history(period="10d", auto_adjust=False)
    if history is None or history.empty:
        raise RuntimeError(f"Yahoo Finance'tan {ticker} için fiyat alınamadı; veri kaynağı erişimini kontrol et")
    last = history.iloc[-1]
    close = float(last["Close"])
    if not (0 < close < float("inf")):
        raise RuntimeError("Yahoo Finance son kapanışı geçersiz")
    return {"provider": "Yahoo Finance via yfinance", "ticker": ticker,
            "date": str(history.index[-1].date()), "close": close,
            "dataLabel": "Gecikmeli/gün sonu veri; canlı BIST kotasyonu değil"}


def run_real_agents(ticker: str, analysis_day: str, dest: Path, provider: str):
    """Calls actual upstream TradingAgentsGraph; no mocks or fallback stories."""
    try:
        from tradingagents.graph.trading_graph import TradingAgentsGraph
        from tradingagents.default_config import DEFAULT_CONFIG
        import tradingagents
    except ImportError as exc:
        raise RuntimeError("Resmî TradingAgents paketi kurulu değil") from exc

    if provider == "chatgpt" and not (Path.home() / ".tradingagents" / "chatgpt-auth.json").is_file():
        raise RuntimeError("Önce bir kez `tradingagents login chatgpt` çalıştırıp hesabınla oturum aç")
    if provider == "openai" and not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OpenAI API kullanımı için özel ortamda OPENAI_API_KEY tanımla; GitHub'a yazma")
    config = deepcopy(DEFAULT_CONFIG)
    config["llm_provider"] = provider
    config["output_language"] = "Turkish"
    # Yahoo is the real stock and fundamental data provider for BIST tickers.
    config["data_vendors"] = {**config.get("data_vendors", {}),
        "core_stock_apis": "yfinance", "technical_indicators": "yfinance",
        "fundamental_data": "yfinance", "news_data": "yfinance"}
    config["results_dir"] = str(dest / "tradingagents_results")
    config["data_cache_dir"] = str(dest / "tradingagents_cache")
    config["memory_log_path"] = str(dest / "tradingagents_memory.md")
    config["max_debate_rounds"] = 1
    config["max_risk_discuss_rounds"] = 1
    config["checkpoint_enabled"] = True
    config["global_news_queries"] = [
        "Turkey CBRT interest rates inflation BIST markets",
        "Turkey energy electricity sector manufacturing exports",
        "global AI data centers energy grid investment",
        "European Central Bank US Federal Reserve macro outlook",
    ]
    analyst_set = ("market", "news", "fundamentals", "social")
    graph = TradingAgentsGraph(selected_analysts=analyst_set, config=config, debug=False)
    state, signal = graph.propagate(ticker, analysis_day)
    reports_dir = dest / f"{ticker}_{analysis_day}"
    reports_dir.mkdir(parents=True, exist_ok=True)
    # Uses upstream report generator (HTML + individual analyst reports).
    graph.save_reports(state, ticker, save_path=reports_dir, html=True)
    manifest = {
        "runAt": datetime.now().astimezone().isoformat(),
        "analysisDate": analysis_day, "ticker": ticker,
        "upstreamVersion": getattr(tradingagents, "__version__", "unknown"),
        "engine": "TauricResearch/TradingAgents", "provider": provider,
        "vendors": config["data_vendors"], "analysts": list(analyst_set),
        "signal": str(signal),
        "warnings": [
            "Yahoo fundamental verileri Türkiye'de KAP bilanço yayımlanma tarihiyle otomatik doğrulanmaz.",
            "BIST değerlendirmesi için KAP ve TEFAS karşı kontrolü zorunludur.",
            "Model sonucu işlem emri veya garanti getiri değildir.",
        ],
    }
    (reports_dir / "kuku_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest, reports_dir


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="KUKU: orijinal TradingAgents ile GERÇEK BIST analizi")
    parser.add_argument("ticker", help="Örn. ASTOR veya ASTOR.IS")
    parser.add_argument("--date", type=valid_day, default=date.today().isoformat())
    parser.add_argument("--provider", choices=["chatgpt", "openai"], default="chatgpt")
    parser.add_argument("--output", help="GitHub deposu dışındaki özel rapor dizini")
    parser.add_argument("--check-data", action="store_true", help="Gerçek Yahoo fiyat bağlantısını test et, ajanları çağırma")
    args = parser.parse_args(argv)
    try:
        ticker = bist_ticker(args.ticker)
        if args.check_data:
            print(json.dumps(vendor_healthcheck(ticker), ensure_ascii=False, indent=2))
            return 0
        dest = private_root(args.output)
        dest.mkdir(parents=True, exist_ok=True)
        manifest, report_path = run_real_agents(ticker, args.date, dest, args.provider)
        print(json.dumps({"status": "completed", "report_path": str(report_path), **manifest}, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(f"KUKU canlı entegrasyon hatası: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
