module.exports = {
  "PRODUCT": "z12",
  "TIMERS": {
    "LINK": 1500,
    "RELINK": 1500,
    "RUNNER": 1000
  },
  "VALUES": {
    "DEFAULT": 0x42,
    '1': 0x01,
    '2': 0x02,
    '3': 0x03,
  },
  "CONDITIONS": [
    {
      "id": "browser",
      "lhs": "app",
      "rhs": ["chrome", "firefox", "safari"],
      "type": "contains"
    },
    {
      "id": "terminal",
      "lhs": "app",
      "rhs": ["terminal", "alacritty"],
      "type": "equals"
    },
    {
      "id": "vim",
      "lhs": "title",
      "rhs": "vim",
      "type": "contains"
    },
    {
      "id": "figma",
      "lhs": "title",
      "rhs": "figma",
      "type": "ends"
    },
    {
      "id": "default",
      "lhs": 1,
      "rhs": 1,
      "type": "equals"
    }
  ],
  "RULES": [
    {
      "operator": "and",
      "conditions": [
        {
          "id": "browser",
          "expected": true
        },
        {
          "id": "figma",
          "expected": true
        },
      ],
      "output": 0x01
    },
    {
      "operator": "and",
      "conditions": [
        {
          "id": "terminal",
          "expected": true
        },
        {
          "id": "vim",
          "expected": true
        },
      ],
      "output": 0x03
    },
    {
      "operator": null,
      "conditions": [
        {
          "id": "browser",
          "expected": true
        }
      ],
      "output": 0x02
    },
    {
      "operator": null,
      "conditions": [
        {
          "id": "default",
          "expected": true
        }
      ],
      "output": 0x42
    },
  ]
};
