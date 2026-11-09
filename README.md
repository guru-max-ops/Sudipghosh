# Sudip Ghosh — Expert Educator & Mentor

Official portfolio website for **Sudip Ghosh**, Expert Educator specializing in IIT-JEE, NEET Physics, CAT Quantitative, UPSC, SSC, Railway NTPC, and State PSC competitive examinations with over 20+ years of dedicated mentoring experience.

## ✨ Features & Architecture

- **Hero Section:**
  - Integrated Originkit **Formula Stream** interactive animated canvas background.
  - Apple-inspired **Liquid Glass** content panel (`backdrop-filter: blur`, specular highlights, high-contrast typography).
  - Quick action buttons and subject badge pills.

- **Numbers Speak (Results) Section:**
  - Integrated Originkit **Cloud Sky** atmospheric animated canvas backdrop.
  - Dynamic key metrics and statistics cards with frosted glass presentation.

- **Why Choose Me Section:**
  - Integrated Originkit **Chalkflow Geometry** chalkboard background with procedural single-stroke mathematics, formulas, and geometry sketches.
  - Frosted liquid-glass header container and feature cards.

- **Programs & Course Offerings:**
  - Comprehensive listing for IIT-JEE Foundation & Advanced, Civil Services, Combined Competitive, Railway Technical & Non-Technical, State PSC, and Fast-Track Crash Courses.

- **Student Reviews & Achievements:**
  - Verified testimonials, success milestones, and student rank spotlights.

- **Interactive Contact & Consultation Form:**
  - Direct inquiry and counseling booking module.

## 🚀 Running Locally

You can serve the static site using any local web server:

### Using Python:
```bash
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your browser.

### Using Node / npx:
```bash
npx serve .
```

## 📁 Project Structure

```
├── index.html                   # Main landing page
├── formula-stream.css/.js       # Formula Stream canvas component
├── chalkflow-geometry.css/.js   # Chalkflow Geometry canvas component
├── cloud-sky.css/.js            # Cloud Sky canvas component
├── stained-glass.css/.js        # Stained Glass canvas component
├── components/originkit/ui/     # Original TSX source components from Originkit
├── three.min.js                 # Three.js 3D library
└── README.md                    # Project documentation
```

