#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FirstPrincipleClaw - 初始化脚本
创建必要的目录和初始数据文件
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

def init():
    """初始化项目"""
    print("🚀 初始化 FirstPrincipleClaw...")

    # 创建 data 目录
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✅ 创建目录: {DATA_DIR}")

    # 创建初始 analysis.json
    analysis_file = DATA_DIR / "analysis.json"
    if not analysis_file.exists():
        initial_data = {
            "task": "欢迎使用 FirstPrincipleClaw",
            "complexity": 0,
            "compression": 0,
            "can_remove": [],
            "analysis": {
                "intent": "等待第一次分析",
                "assumptions": [],
                "facts": [],
                "reasoning": "",
                "solution": "系统已就绪，等待 Agent 调用"
            },
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }
        analysis_file.write_text(json.dumps(initial_data, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"✅ 创建文件: {analysis_file}")

    # 创建空 history.json
    history_file = DATA_DIR / "history.json"
    if not history_file.exists():
        history_file.write_text("[]", encoding='utf-8')
        print(f"✅ 创建文件: {history_file}")

    print("\n✨ 初始化完成！")
    print(f"\n下一步:")
    print(f"  1. 运行服务器: python3 server/server.py")
    print(f"  2. 访问: http://127.0.0.1:5000")

if __name__ == "__main__":
    init()
