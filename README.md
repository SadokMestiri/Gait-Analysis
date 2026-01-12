# Gait Analysis Pro

Advanced biomechanical analysis platform for clinical gait assessment and rehabilitation monitoring.

## Features
- Real-time sensor data visualization
- Multi-IMU data processing
- Gait parameter extraction
- Patient record management
- Range of motion analysis
- Step-by-step gait analysis

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Charts:** Recharts
- **Data Processing:** Custom gait analysis algorithms
- **Excel Integration:** SheetJS (xlsx)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/Gait-Analysis.git

# Navigate to project
cd Gait-Analysis

# Install dependencies
npm install

# Start development server
npm start

Project Structure
text
gait-analysis/
├── src/
│   ├── components/     # React components
│   ├── services/      # Business logic
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── public/            # Static files
└── package.json       # Dependencies

Data Format
The system processes IAW Data Logger sensor files (.txt) with multiple IMU data streams and gait parameters.

License
MIT License

text

### **Step 4: Stage and Commit Your Code**
```bash
# Add all files (excluding .gitignore patterns)
git add .

# Commit with descriptive message
git commit -m "Initial commit: Gait Analysis Pro with complete data visualization, multi-IMU support, and patient management"

# If you want to see what will be committed first:
git status