# 🚀 AstraDesk

**AstraDesk** is a lightweight, borderless desktop productivity assistant built with **Neutralinojs**. Designed as a modern sidebar companion, it provides instant access to global news, market data, developer intelligence, and real-time system monitoring without the heavy resource consumption of traditional desktop dashboards.

---

## ✨ Features

### 🏠 Hub Dashboard

A centralized dashboard that combines:

* 🌍 World News
* 🇮🇳 India News
* 💻 Technology Updates
* 🎮 Gaming Headlines
* 🚀 Space Discoveries
* 🔐 Cybersecurity Alerts
* ⚡ Real-Time Breaking News Banner
* 📊 Quick System Status Overview

---

### 👨‍💻 Developer Intelligence Center

Stay updated with the latest trends in software development:

* Trending GitHub Repositories
* Top Hacker News Discussions
* Popular Stack Overflow Questions
* Developer Ecosystem Insights

---

### 🖥️ System Performance Suite

Monitor your machine in real time through elegant visual widgets.

#### Circular Performance Meters

* CPU Usage
* RAM Utilization
* GPU Usage
* Disk Consumption

#### Hardware Monitoring

* CPU Temperature
* GPU Temperature
* Fan Speed (RPM)
* Battery Status

#### Live Network Monitor

* Real-time Upload Speed
* Real-time Download Speed
* Interactive Canvas-Based Throughput Graph

---

### 📈 Finance & Market Center

Track financial markets directly from your desktop.

#### Market Data

* SENSEX
* NIFTY
* Gold Prices
* Bitcoin (BTC/USD)
* Market Reports & Trends

---

### 📍 Regional News Feed

Dedicated local updates including:

* Tamil Nadu News
* Chennai News
* Regional Alerts and Events

---

### 🎨 Dynamic Theme Engine

Switch between beautiful built-in themes instantly:

| Theme    | Description                 |
| -------- | --------------------------- |
| Astra    | Default futuristic design   |
| Cyber    | Neon cyberpunk appearance   |
| Solar    | Warm solar-inspired palette |
| Nova     | Modern clean interface      |
| Midnight | Dark minimalistic mode      |

---

### ⚙️ Layout & Window Controls

Customize the desktop experience:

#### Docking Modes

* Right Dock
* Left Dock
* Floating Window

#### Window Features

* Always On Top
* Drag & Move
* Pin / Unpin

#### Appearance Controls

* Adjustable Width (320px – 600px)
* Adjustable Transparency (60% – 100%)

---

## 🏗️ Architecture

### Neutralinojs Native Shell

Unlike Electron-based applications, AstraDesk uses **Neutralinojs**, which leverages the operating system's native web view.

### Benefits

✅ Extremely lightweight

✅ Low memory consumption

✅ Small binary size

✅ Native desktop APIs

✅ Fast startup time

---

## 🔄 Triple-Fallback RSS Aggregator

RSS feeds often face browser CORS restrictions.

AstraDesk solves this using a multi-proxy fallback strategy:

```javascript
PROXIES: [
  u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
]
```

### How It Works

1. Attempt request using AllOrigins.
2. If unavailable, switch to CorsProxy.
3. If rate-limited or blocked, fallback to Codetabs.
4. Parse XML feeds into normalized JSON data.
5. Display results directly in the dashboard.

No dedicated backend server required.

---

## 💾 Configuration Persistence

User preferences are automatically saved.

### Stored Settings

* Selected Theme
* Window Position
* Docking State
* Opacity
* Widget Width
* API Tokens
* User Preferences

### Storage Strategy

Primary:

```javascript
Neutralino.storage.setData()
```

Fallback:

```javascript
localStorage
```

---

## 📡 Real-Time Network Visualization

Network bandwidth history is collected continuously and rendered using:

* HTML5 Canvas
* Bezier Curve Rendering
* Buffered Data Streams
* Smooth Animated Updates

This provides a visually appealing live throughput graph.

---

## 🛠️ Technology Stack

### Runtime

* Neutralinojs v6.7.0

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)

### Visualization

* SVG
* HTML5 Canvas

### Storage

* Neutralino Storage API
* Browser localStorage

---

## 🔌 APIs & Data Sources

### News Sources

* RSS Feeds
* Regional News Providers

### Financial Data

* Yahoo Finance API

### Developer Data

* GitHub Search API
* Hacker News API
* StackExchange API

### CORS Services

* AllOrigins
* CorsProxy.io
* Codetabs Proxy

---

## 📂 Project Structure

```text
AstraDesk/
│
├── index.html          # Main UI
├── app.js              # Application Logic
├── feeds.js            # RSS Aggregation Layer
├── styles.css          # Theme Engine
├── neutralino.js       # Native API Client
├── resources/
│   ├── themes/
│   ├── icons/
│   └── assets/
│
└── README.md
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/yourusername/AstraDesk.git
cd AstraDesk
```

### Install Neutralino CLI

```bash
npm install -g @neutralinojs/neu
```

### Run Application

```bash
neu run
```

### Build Production Package

```bash
neu build
```

---

## 🎯 Vision

AstraDesk aims to become the ultimate lightweight desktop companion by combining:

* News Intelligence
* Developer Insights
* System Monitoring
* Financial Awareness
* Regional Information

all within a single elegant desktop sidebar that consumes only a fraction of the resources required by traditional desktop dashboard applications.

---

## 📜 License

MIT License

Feel free to use, modify, and contribute to AstraDesk.
