// All numbers transcribed from the paper's tables. Edit here to update charts.

// Fig. 2: Verve-MCQ examples. `edit` = the word(s) highlighted in each query.
// preds: per model, whether the answer was correct, and (optional) the chosen option index.
window.MCQ_EXAMPLES = [
  {
    tag: "Target · object", img: "static/examples/ex1.webp",
    pos: { q: "What's the color of the [scooter]?", gt: 1 },
    neg: { q: "What's the color of the [bike]?", gt: 4 },
    opts: ["black with gray highlights", "Light gray with black accents", "Deep blue with chrome details", "Bright red with white trim", "There is no such scooter/bike"],
    preds: { gemini: [[1, true], [1, false]], opd: [[1, true], [1, false]], verve: [[1, true], [4, true]] }
  },
  {
    tag: "Target · object", img: "static/examples/ex2.webp",
    pos: { q: "What text is written on the man's blue [cap]?", gt: 0 },
    neg: { q: "What text is written on the man's blue [helmet]?", gt: 1 },
    opts: ["ROAD RACE TRIAL", "Such a text is not found", "RACE TEAM JAPAN", "OFF ROAD RALLY", "MOTOR SPORTS"],
    preds: { gemini: [[0, true], [0, false]], opd: [[0, true], [0, false]], verve: [[0, true], [1, true]] }
  },
  {
    tag: "1-Hop · object", img: "static/examples/ex3.webp",
    pos: { q: "What symbol is inside the yellow square on the [sign]?", gt: 2 },
    neg: { q: "What symbol is inside the yellow square on the [bench]?", gt: 4 },
    opts: ["a checkmark", "a person walking", "an airplane landing", "a suitcase", "there is no such symbol"],
    preds: { gemini: [[2, true], [null, false]], opd: [[2, true], [null, false]], verve: [[2, true], [4, true]] }
  },
  {
    tag: "2-Hop · relation", img: "static/examples/ex4.webp",
    pos: { q: "What type of plant is in the hanging pot [to the right of] the statue?", gt: 2 },
    neg: { q: "What type of plant is in the hanging pot [above] the statue?", gt: 1 },
    opts: ["fuchsia", "there is no such plant", "geranium", "begonia", "petunia"],
    preds: { gemini: [[2, true], [null, false]], opd: [[2, true], [null, false]], verve: [[2, true], [1, true]] }
  }
];
window.MCQ_MODELS = [
  { key: "gemini", name: "Gemini-3.7-Flash" },
  { key: "opd", name: "Vision-OPD-9B" },
  { key: "verve", name: "VERVE-9B (ours)", ours: true }
];

// Tab. 1: Verve-MCQ paired accuracy. kind: frontier | base | prior | ours
window.MCQ_COLS = ["Average", "Target · obj", "Target · attr", "1-Hop · obj", "1-Hop · attr", "1-Hop · rel", "2-Hop · obj", "2-Hop · attr", "2-Hop · rel"];
window.MCQ_TABLE = [
  { group: "Frontier", rows: [
    ["GLM-4.6V (107B)", "frontier", [15.5, 24.9, 18.1, 17.1, 6.6, 6.9, 9.5, 6.8, 4.6]],
    ["Qwen3.5-397B", "frontier", [23.0, 36.4, 23.9, 23.1, 16.8, 12.9, 14.3, 8.1, 6.1]],
    ["Kimi-K3 (3T)", "frontier", [26.6, 36.0, 33.1, 24.9, 19.5, 18.3, 16.7, 13.5, 9.1]],
    ["GPT-5.6 Sol", "frontier", [13.9, 24.7, 16.5, 11.5, 7.1, 6.4, 7.1, 2.7, 3.0]],
    ["Gemini-3.7-Flash", "frontier", [41.5, 47.0, 48.9, 46.8, 35.8, 32.7, 26.2, 27.0, 21.2]]
  ]},
  { group: "Qwen2.5-VL-7B", rows: [
    ["Qwen2.5-VL-7B", "base", [11.4, 21.6, 8.7, 11.5, 5.8, 6.4, 8.3, 4.1, 4.6]],
    ["+ Thyme", "prior", [2.7, 6.5, 1.5, 3.0, 1.3, 1.0, 0.0, 0.0, 0.0]],
    ["+ DeepEyes", "prior", [3.9, 8.5, 3.6, 3.4, 2.2, 0.5, 2.4, 0.0, 0.0]],
    ["+ DeepEyes-V2", "prior", [3.5, 7.9, 2.8, 3.4, 0.9, 1.5, 2.4, 0.0, 0.0]],
    ["+ TreeVGR", "prior", [6.0, 17.1, 3.1, 4.1, 1.3, 1.5, 1.2, 0.0, 0.0]],
    ["+ VERVE plain", "ours", [33.5, 44.5, 38.4, 34.9, 30.5, 14.4, 33.3, 24.3, 4.6]],
    ["+ VERVE opsv", "ours", [40.8, 50.3, 44.3, 42.4, 42.5, 21.3, 42.9, 35.1, 7.6]]
  ]},
  { group: "Qwen3-VL-8B", rows: [
    ["Qwen3-VL-8B", "base", [11.2, 19.8, 12.0, 12.6, 5.3, 5.5, 4.8, 0.0, 1.5]],
    ["+ ToolUse", "prior", [19.7, 33.5, 19.1, 22.3, 12.4, 9.9, 11.9, 4.1, 3.0]],
    ["+ ZwZ", "prior", [7.6, 18.2, 7.6, 3.4, 2.2, 1.0, 6.0, 0.0, 1.5]],
    ["+ VERVE plain", "ours", [41.8, 51.9, 45.0, 46.8, 40.7, 24.3, 38.1, 29.7, 10.6]],
    ["+ VERVE opsv", "ours", [42.2, 49.0, 48.1, 47.6, 39.8, 21.8, 50.0, 31.1, 12.1]]
  ]},
  { group: "Qwen3.5-9B", rows: [
    ["Qwen3.5-9B", "base", [20.1, 29.0, 21.6, 22.7, 18.1, 8.9, 13.1, 9.5, 3.0]],
    ["+ ToolUse", "prior", [17.9, 31.5, 21.9, 15.2, 11.1, 6.4, 6.0, 4.1, 3.0]],
    ["+ Vision-OPD", "prior", [15.6, 27.6, 19.6, 13.0, 9.7, 5.5, 7.1, 0.0, 1.5]],
    ["+ VERVE plain", "ours", [49.7, 57.3, 54.2, 52.8, 48.7, 33.7, 52.4, 39.2, 21.2]],
    ["+ VERVE opsv", "ours", [55.3, 61.8, 60.3, 58.7, 54.0, 47.5, 50.0, 40.5, 19.7]]
  ]}
];

// Tab. (app.) Verve-Binary: [name, kind, pairedAvg, GT=yes, GT=no]
window.BINARY = {
  "Qwen2.5-VL-7B": [
    ["Qwen2.5-VL-7B", "base", 70.65, 77.77, 92.50],
    ["+ TreeVGR", "prior", 57.08, 97.54, 53.85],
    ["+ DeepEyes", "prior", 44.94, 95.34, 40.32],
    ["+ DeepEyes-V2", "prior", 20.24, 99.89, 10.25],
    ["+ Thyme", "prior", 66.55, 94.75, 68.25],
    ["+ VERVE plain", "ours", 74.94, 79.06, 96.18],
    ["+ VERVE opsv", "ours", 79.52, 91.38, 86.67]
  ],
  "Qwen3-VL-8B": [
    ["Qwen3-VL-8B", "base", 77.92, 92.02, 83.59],
    ["+ ZwZ", "prior", 55.48, 99.14, 50.50],
    ["+ VERVE plain", "ours", 83.93, 91.43, 91.63],
    ["+ VERVE opsv", "ours", 81.96, 90.14, 90.76]
  ],
  "Qwen3.5-9B": [
    ["Qwen3.5-9B", "base", 73.15, 95.50, 74.61],
    ["+ Vision-OPD", "prior", 59.46, 99.25, 55.12],
    ["+ VERVE plain", "ours", 86.55, 90.57, 95.85],
    ["+ VERVE opsv", "ours", 87.44, 93.09, 93.90]
  ],
  "Gemini": [
    ["Gemini-3.7-Flash", "frontier", 85.65, 94.54, 90.09]
  ]
};

// Tab. 2: perception & hallucination benchmarks.
window.PERC_COLS = ["V*", "HR-Bench-4K", "HR-Bench-8K", "CV-Bench", "ColorBench", "CountQA", "BabyVision", "PerceptionBench", "Perception avg"];
window.HALL_COLS = ["FINER-CompreCap", "RePOPE", "DASH", "HallusionBench", "AMBER", "HaloQuest", "Hallucination avg"];
window.PH = [
  { backbone: "Qwen2.5-VL-7B", color: "#3f7fb5", rows: [
    ["Base", "base", [79.1, 72.6, 66.4, 74.7, 76.8, 22.2, 10.5, 24.2, 57.5], [54.5, 92.4, 81.7, 43.3, 86.9, 75.0, 72.3]],
    ["TreeVGR", "prior", [86.3, 76.6, 72.7, 74.3, 75.2, 22.2, 12.3, 24.1, 59.9], [43.0, 90.0, 60.3, 29.7, 84.3, 38.5, 57.6]],
    ["DeepEyes", "prior", [82.2, 73.5, 68.6, 78.2, 77.6, 19.1, 12.8, null, 58.9], [44.6, 86.9, 54.4, 33.2, 82.5, 46.8, 58.1]],
    ["DeepEyes-V2", "prior", [80.6, 75.3, 72.4, 79.7, 77.6, 18.0, 13.1, null, 59.5], [42.2, 45.8, 51.0, 37.5, 43.7, 23.3, 40.6]],
    ["Thyme", "prior", [82.7, 77.5, 72.1, 78.2, 77.7, 21.5, 14.1, null, 60.5], [47.3, 85.4, 63.1, 47.9, 85.2, 32.8, 60.3]],
    ["VERVE plain", "ours", [89.0, 75.3, 72.6, 76.2, 78.7, 20.4, 13.1, 25.8, 60.8], [63.0, 93.5, 83.5, 43.9, 87.4, 84.2, 75.9]],
    ["VERVE opsv", "ours", [85.9, 73.4, 73.3, 77.7, 77.6, 20.3, 13.2, 26.8, 60.2], [62.8, 93.9, 80.4, 44.2, 88.1, 81.5, 75.1]]
  ]},
  { backbone: "Qwen3-VL-8B", color: "#3b9a74", rows: [
    ["Base", "base", [83.2, 79.6, 76.2, 85.2, 82.5, 28.5, 15.7, 29.2, 64.4], [67.5, 94.0, 75.1, 57.5, 87.3, 75.0, 76.1]],
    ["ZwZ", "prior", [91.1, 84.3, 82.0, 86.9, 83.1, 29.5, 16.7, 31.6, 67.7], [56.7, 89.4, 58.6, 60.1, 82.6, 54.0, 66.9]],
    ["VERVE plain", "ours", [85.8, 83.0, 80.0, 85.9, 83.5, 29.8, 12.3, 32.9, 65.8], [70.5, 94.7, 84.2, 62.1, 87.5, 85.8, 80.8]],
    ["VERVE opsv", "ours", [89.0, 84.0, 81.6, 85.7, 83.6, 30.5, 15.7, 32.0, 67.2], [72.1, 95.1, 84.4, 62.7, 87.9, 82.3, 80.8]]
  ]},
  { backbone: "Qwen3.5-9B", color: "#d9822b", rows: [
    ["Base", "base", [83.2, 85.6, 80.5, 86.1, 83.8, 34.6, 18.0, 33.9, 67.4], [71.6, 94.0, 70.5, 63.2, 88.0, 70.0, 76.2]],
    ["Vision-OPD", "prior", [90.1, 87.0, 84.3, 88.6, 85.2, 38.3, 18.0, 35.5, 70.2], [68.6, 92.5, 57.1, 58.6, 85.4, 65.3, 71.3]],
    ["VERVE plain", "ours", [90.6, 87.1, 84.0, 88.2, 85.3, 43.5, 21.7, 39.1, 71.5], [82.3, 95.7, 84.8, 65.9, 88.4, 87.7, 84.1]],
    ["VERVE opsv", "ours", [90.1, 88.8, 84.5, 88.1, 85.4, 40.0, 20.6, 39.9, 71.1], [79.7, 95.5, 82.2, 66.8, 89.0, 84.2, 82.9]]
  ]}
];

// Tab. 3: cross-task transfer.
window.XFER_COLS = ["MMStar", "PerceptionRubrics", "VL-RewardBench", "MMRB2", "GroundingME", "ProbMed-1K", "VidHalluc"];
window.XFER_SHORT = ["MMStar", "P.Rubrics", "VL-Reward", "MMRB2", "GroundME", "ProbMed", "VidHalluc"];
window.XFER_TAGS = ["general", "caption", "reward", "reward", "grounding", "medical", "video"];
window.XFER = {
  "Qwen3-VL-8B": {
    base: [71.9, 39.0, 61.5, 54.9, 31.1, 59.7, 76.5],
    prior: ["ZwZ", [73.1, 43.0, 63.8, 55.4, 36.7, 54.2, 75.5]],
    plain: [74.1, 43.3, 68.9, 56.9, 35.6, 58.6, 74.9],
    opsv: [73.1, 44.0, 67.0, 56.3, 34.5, 60.6, 76.3]
  },
  "Qwen3.5-9B": {
    base: [74.3, 50.8, 59.8, 56.5, 38.8, 61.7, 76.7],
    prior: ["Vision-OPD", [76.1, 50.4, 66.8, 57.4, 34.9, 52.9, 79.3]],
    plain: [78.1, 56.2, 73.2, 59.3, 46.4, 62.5, 80.0],
    opsv: [76.9, 53.5, 73.9, 59.1, 50.2, 62.7, 77.8]
  }
};
