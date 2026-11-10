# 🏊‍♀️🚴‍♂️🏃 TriCalc - The Vibe-Coded Triathlon Calculator

**Explore the app:**  [https://triathloncalc.netlify.app/](https://triathloncalc.netlify.app/)

## 📝 Project Description
TriCalc is a modern, single-page web application designed to help triathletes accurately calculate and estimate their total race time. Simply input your distances and either your pace/speed or total time for each segment (Swim, Bike, Run, T1, T2), and TriCalc instantly delivers your cumulative race time.

Built with a sleek, tech-focused dark mode aesthetic, this tool was deliberately **vibe coded** using only pure HTML, CSS, and Vanilla JavaScript to ensure maximum speed and zero dependency bloat.

## ✨ Features

* **Bi-Directional Calculation:** Input Pace/Speed to get Time, or input Time to get Pace/Speed.
* **Unit Toggle:** Instantly switch between Metric (km/m) and Imperial (miles/yards) units.
* **Pre-set Distances:** Quickly load standard race distances (Sprint, Olympic, Half IM, Full IM).
* **Customization:** All distances are editable for non-standard races.
* **Theme Switcher:** Toggle between default Dark Mode and a high-contrast Light Mode.
* **Responsive Design:** Fully optimized for mobile and desktop viewing.

## ⚙️ Technology Stack

* **HTML5** (Semantic Structure)
* **CSS3** (Clean, well-documented, no frameworks)
* **Vanilla JavaScript** (For all logic, calculations, and UI handling)
* **Google Fonts:** Poppins & Open Sans
* **Font Awesome** (For relevant icons)

## 💡 How to Use

1.  **Select Units:** Use the top toggle to choose Metric or Imperial.
2.  **Set Distance:** Select a pre-set race (e.g., Olympic) or manually enter the Swim, Bike, and Run distances.
3.  **Enter Data:** Input your desired pace or speed for the Swim, Bike, and Run segments. Alternatively, enter a total time and the calculator will find the required pace/speed.
4.  **View Results:** The **TOTAL TIME** section will instantly update to show your estimated final result.

## 🤖 Agent-Ready

TriCalc is built to be found, read and used by AI agents and assistants (e.g. Claude in Chrome), not just people:

* **Deep links:** pre-fill a calculation from the URL, e.g. [`/?preset=olympic&swimPace=1:45&bikeSpeed=32&runPace=5:00&t1=2:00&t2=1:30`](https://triathloncalc.netlify.app/?preset=olympic&swimPace=1:45&bikeSpeed=32&runPace=5:00&t1=2:00&t2=1:30). All parameters are documented in [`llms.txt`](llms.txt).
* **Discoverability:** `robots.txt`, `sitemap.xml`, `llms.txt`, a canonical URL, Open Graph tags and `WebApplication` JSON-LD.
* **Readable without JavaScript:** preset distances and the calculation formulas are in the static HTML.
* **Secure by default:** a strict Content-Security-Policy and standard security headers (`_headers`), and strictly validated, range-limited deep-link values.
* **Usable by browser agents:** every input has a descriptive accessible name, the finish time is a labelled live region, and results update on the `change` event so programmatic form fills work.

---

**Built with focus and good vibes.**
