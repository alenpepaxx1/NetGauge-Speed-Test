# Global Speed Test

A sleek, real-time internet speed and latency testing application. It allows you to measure your download speed, upload speed, ping, and jitter against geographically distributed global nodes using real HTTP requests.

## Features

- **Real-time Metrics**: Measures authentic Download, Upload, Ping, and Jitter.
- **Multi-Country Nodes**: Test your connection against real, globally distributed endpoints (e.g., US, Europe, Asia, South America, Australia).
- **Ping All**: Instantly check your latency across all global nodes simultaneously to find the best server.
- **Beautiful UI**: A highly responsive, dark-mode terminal-inspired user interface featuring live streaming charts and dynamic network detection.
- **Authentic Data**: No simulated or artificially padded numbers. The application executes real network requests to provide the most accurate readings possible.

## Installation

This application is built with Next.js and requires Node.js.

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Open your browser and navigate to `http://localhost:3000`.

## Usage

1. **Select a Server**: By default, a server is selected for you. You can change this by clicking the "CHANGE" button in the Node section on the dashboard.
2. **Compare Latencies**: Inside the server dropdown, you can hover over individual servers to ping them or click **Ping All** to see real-time latency (in milliseconds) to every global node.
3. **Run the Test**: Click the large **"INITIALIZE TEST"** button. The app will sequence through:
   - **Ping Test**: Measuring latency and jitter.
   - **Download Test**: Measuring inbound bandwidth.
   - **Upload Test**: Measuring outbound bandwidth.
4. **View Results**: A live chart will display the network stability during the test, and final metrics will be displayed prominently.

## Architecture

- **Frontend Framework**: Next.js 15 (App Router) / React
- **Styling**: Tailwind CSS
- **Animations**: `motion/react` (Framer Motion)
- **Icons**: Lucide React
- **Charts**: Recharts

## Author

**Built by Alen Pepa**
