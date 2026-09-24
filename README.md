# 🧊 RubikClear — Cross-Platform 3D Rubik's Cube Solver

**RubikClear** is an interactive, cross-platform 3D Rubik's Cube Solver designed to run smoothly on **Browser**, **Android**, and **iPhone (iOS)**.

Built with **React**, **Three.js**, **Tailwind CSS**, and **Capacitor**, it allows users to snap pictures of all 6 faces of their physical cube, automatically detects sticker colors with computer vision, and visually guides them to solve their cube move-by-move in 3D.

---

## 🚀 Key Features

1. 📸 **Camera Face Scanner with Color Recognition**
   - Live camera view with 3x3 augmented viewfinder alignment grid.
   - Intelligent pixel sampling with HSV color classification (White, Yellow, Green, Blue, Red, Orange).
   - Step-by-step guided scanning sequence for all 6 faces (U, R, F, D, L, B).
   - Gallery / photo file upload fallback for devices or browsers without direct camera permissions.
   - Interactive 1-tap color correction palette for quick manual touch-ups if lighting or reflections cause misdetections.

2. 🧠 **Optimal Two-Phase Kociemba Algorithm**
   - High-performance, client-side Rubik's cube solver running in pure TypeScript/JavaScript.
   - Solves any valid scramble in **~20 moves or fewer** within milliseconds.
   - 100% offline — requires zero backend servers or internet connection.
   - Instant validation: checks sticker counts (9 of each color), unique centers, and parity / twisted pieces with helpful diagnostic feedback.

3. 🎬 **Interactive 3D Visual Guide**
   - Real-time 3D Rubik's cube rendered with Three.js.
   - Dynamic curved 3D turn arrows directly on the cube face indicating the exact turning direction.
   - Step-by-step playback controls (Play, Pause, Step Forward, Step Backward, Timeline scrubber).
   - Playback speed adjustment (0.5x, 1x, 1.5x).
   - Orbit controls: touch-drag to rotate, pinch to zoom, and quick "Face Focus" camera alignment.
   - Solved celebration with celebratory 3D cube spin and confetti!

4. 🎮 **3D Sandbox & Presets**
   - Random 20-move WCA scrambler.
   - Famous cube patterns: Checkerboard, Superflip, Cube-in-a-Cube, Anaconda.
   - Manual slice control buttons (`U`, `U'`, `R`, `R'`, `F`, `F'`, `D`, `D'`, `L`, `L'`, `B`, `B'`).

---

## 📱 Running Across Platforms

### 1. In Browser (Desktop & Laptop)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. On Mobile (Android & iPhone via Wi-Fi)
1. Start the Vite dev server (`npm run dev` already exposes the network URL).
2. Look at the terminal output for the **Network** address (e.g. `http://192.168.88.139:5173`).
3. Connect your Android phone or iPhone to the **same Wi-Fi network** and open that URL in Safari or Chrome.
4. **Install as PWA**:
   - **iPhone (iOS Safari)**: Tap the Share button ➔ "Add to Home Screen".
   - **Android (Chrome)**: Tap the three dots menu ➔ "Install app" or "Add to Home Screen".

### 3. Packaging into Native Android & iOS Apps (Capacitor)
To build standalone native packages for Google Play and the Apple App Store:

1. Build the production web bundle:
```bash
npm run build
```

2. Add Android and iOS platforms:
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

3. Sync web assets:
```bash
npx cap sync
```

4. Open in Android Studio or Xcode:
```bash
npx cap open android   # Launches Android Studio to build .apk / .aab
npx cap open ios       # Launches Xcode to build iOS app
```

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **3D Engine**: Three.js (WebGL rendering, quaternions, slice pivot rotations)
- **Solving Engine**: Kociemba Two-Phase Algorithm via `@turnwise/cube-solver`
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Effects**: canvas-confetti
- **Cross-Platform Bridge**: Capacitor 8 + Progressive Web App (PWA)
