#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FirstPrincipleClaw - 更新分析结果脚本
用于 Agent 写入分析数据到 data/analysis.json
"""
import json
import argparse
import sys
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 数据目录
DATA_DIR = Path(__file__).parent.parent / "data"
ANALYSIS_FILE = DATA_DIR / "analysis.json"
HISTORY_FILE = DATA_DIR / "history.json"

def update_analysis(args):
    """更新当前分析结果"""

    # 构建分析数据
    analysis_data = {
        "task": args.task,
        "complexity": args.complexity,
        "compression": args.compression,
        "can_remove": args.can_remove.split(",") if args.can_remove else [],
        "analysis": {
            "intent": args.intent or "",
            "assumptions": args.assumptions.split("|") if args.assumptions else [],
            "facts": args.facts.split("|") if args.facts else [],
            "reasoning": args.reasoning or "",
            "solution": args.solution or ""
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # 确保目录存在
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 写入当前分析
    with open(ANALYSIS_FILE, "w", encoding="utf-8") as f:
        json.dump(analysis_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 分析结果已更新: {ANALYSIS_FILE}")

    # 追加到历史记录
    append_to_history(analysis_data)


def append_to_history(data):
    """追加到历史记录"""
    history = []

    # 读取现有历史
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)

    # 追加新记录
    history.append(data)

    # 只保留最近 100 条
    history = history[-100:]

    # 写入
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"✅ 已追加到历史记录 (共 {len(history)} 条)")


def main():
    parser = argparse.ArgumentParser(description="更新第一性原理分析结果")
    parser.add_argument("--task", required=True, help="任务描述")
    parser.add_argument("--complexity", type=int, required=True, help="复杂度 (0-100)")
    parser.add_argument("--compression", type=int, required=True, help="压缩率 (百分比)")
    parser.add_argument("--can-remove", default="", help="可砍掉的项目 (逗号分隔)")
    parser.add_argument("--intent", default="", help="用户意图")
    parser.add_argument("--assumptions", default="", help="隐含假设 (|分隔)")
    parser.add_argument("--facts", default="", help="客观事实 (|分隔)")
    parser.add_argument("--reasoning", default="", help="推导过程")
    parser.add_argument("--solution", default="", help="最简方案")

    args = parser.parse_args()
    update_analysis(args)


if __name__ == "__main__":
    main()
