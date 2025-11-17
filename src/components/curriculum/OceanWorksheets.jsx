import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Printer,
  CheckSquare,
  Edit3,
  BarChart3,
  BookOpen,
  Clipboard
} from 'lucide-react';

/**
 * Ocean Worksheets - Downloadable & Printable Educational Materials
 *
 * Complete set of classroom-ready worksheets for ocean science education
 * All worksheets are downloadable as text files and print-optimized
 */
const OceanWorksheets = () => {
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);

  const worksheets = [
    {
      id: 'beach-erosion-data',
      title: 'Beach Erosion Data Collection Sheet',
      category: 'Experiment',
      grades: '4-8',
      pages: 2,
      description: 'Record observations and measurements during beach erosion simulation',
      content: `BEACH EROSION SIMULATION - DATA COLLECTION SHEET

Name: _________________________ Date: _____________ Class: _____________

HYPOTHESIS:
What do you think will happen to the beach with waves? Will vegetation help?
_________________________________________________________________
_________________________________________________________________

MATERIALS CHECKLIST:
□ Plastic container or pan
□ Sand (2-3 cups)
□ Water
□ Watering can or cup
□ Small plants or toothpicks (for vegetation)
□ Ruler
□ Camera or phone (for photos)

EXPERIMENT 1: BARE BEACH (No Protection)

Initial Measurements:
Beach length from edge: __________ cm
Beach height: __________ cm
Sand color/texture: _________________________________________________

After 2 Minutes of Waves:
Beach length from edge: __________ cm
Beach height: __________ cm
Amount of erosion: __________ cm
Where did the sand go? ___________________________________________

Observations:
_________________________________________________________________
_________________________________________________________________

EXPERIMENT 2: VEGETATED BEACH (With Plants/Toothpicks)

Initial Measurements:
Beach length from edge: __________ cm
Beach height: __________ cm
Number of "plants" added: __________

After 2 Minutes of Waves:
Beach length from edge: __________ cm
Beach height: __________ cm
Amount of erosion: __________ cm
Number of "plants" remaining: __________

Observations:
_________________________________________________________________
_________________________________________________________________

COMPARISON:
Which beach had MORE erosion? □ Bare □ Vegetated
How much MORE erosion? __________ cm

Why do you think vegetation helped protect the beach?
_________________________________________________________________
_________________________________________________________________

REAL-WORLD CONNECTION:
How can this experiment help us protect real beaches?
_________________________________________________________________
_________________________________________________________________

DRAWING: Sketch your beach BEFORE and AFTER the waves

[BEFORE - Draw here]


[AFTER - Draw here]


CONCLUSION:
What did you learn about coastal erosion and protection?
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

Teacher Signature: ___________________ Parent Signature: ___________________
`,
      icon: Clipboard
    },

    {
      id: 'tsunami-safety-quiz',
      title: 'Tsunami Safety Knowledge Check',
      category: 'Assessment',
      grades: '6-12',
      pages: 2,
      description: 'Pre/post assessment for tsunami science and safety unit',
      content: `TSUNAMI SAFETY - KNOWLEDGE CHECK

Name: _________________________ Date: _____________ Grade: _____________

PART 1: TRUE OR FALSE (Circle T or F)

T  F  1. Tsunamis are caused by underwater earthquakes.
T  F  2. A tsunami looks like a regular surfing wave.
T  F  3. If the ocean water pulls back suddenly, a tsunami might be coming.
T  F  4. You should wait for an official warning before evacuating.
T  F  5. Tsunamis travel faster in deep ocean water than in shallow water.
T  F  6. A loud roaring sound can be a tsunami warning sign.
T  F  7. One tsunami wave is all you need to worry about.
T  F  8. Staying on the beach to watch a tsunami is safe if you're far back.
T  F  9. High ground is the safest place during a tsunami.
T  F  10. Tsunamis only happen in the Pacific Ocean.

PART 2: MULTIPLE CHOICE (Circle the best answer)

11. How fast can a tsunami travel in the deep ocean?
    a) 10 mph
    b) 50 mph
    c) 500 mph
    d) 1000 mph

12. What should you do if you feel a strong earthquake at the beach?
    a) Go swimming
    b) Move to high ground immediately
    c) Wait and see what happens
    d) Take photos

13. How tall can tsunami waves be when they reach shore?
    a) 1-5 feet
    b) 10-20 feet
    c) Over 100 feet
    d) Tsunamis are always small

14. What does "drawback" mean in tsunami terms?
    a) Ocean water pulling back from shore
    b) A type of wave
    c) A warning siren
    d) An evacuation route

15. Which of these is NOT a tsunami warning sign?
    a) Strong coastal earthquake
    b) Ocean receding rapidly
    c) Loud roar from ocean
    d) Sunny weather

PART 3: SHORT ANSWER

16. Explain in your own words how an underwater earthquake creates a tsunami:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

17. Why do tsunami waves get taller as they approach shore?
_________________________________________________________________
_________________________________________________________________

18. Draw and label a tsunami evacuation route from the beach to safety:

[DRAWING SPACE]


19. List THREE things you should include in a tsunami emergency kit:
    1. _______________________________________________________
    2. _______________________________________________________
    3. _______________________________________________________

20. If you lived in a coastal town, what would you do to prepare for a possible tsunami?
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

PART 4: REAL-WORLD APPLICATION

21. The 2004 Indian Ocean tsunami killed 230,000 people. The 2011 Japan tsunami killed 18,000 people. Why was the death toll so different?
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

22. How long would it take for a tsunami to reach your shore if detected 100 miles away traveling at 500 mph?
    Show your work: ___________________________________________
    Answer: __________ minutes

ANSWER KEY (For Teachers):
1-5: T,F,T,F,T  6-10: T,F,F,T,F  11: c  12: b  13: c  14: a  15: d
`,
      icon: CheckSquare
    },

    {
      id: 'ocean-acidification-lab',
      title: 'Ocean Acidification Lab Report',
      category: 'Experiment',
      grades: '7-12',
      pages: 3,
      description: 'Complete lab report template for ocean acidification experiment',
      content: `OCEAN ACIDIFICATION EXPERIMENT - LAB REPORT

Name: _________________________ Lab Partner: _________________________
Date: _____________ Class Period: _____________

TITLE: The Effect of Ocean Acidification on Calcium Carbonate Shells

RESEARCH QUESTION:
How does ocean pH affect the structure of shells made of calcium carbonate?

HYPOTHESIS:
I predict that ___________________________________________________
_________________________________________________________________
because _________________________________________________________
_________________________________________________________________

BACKGROUND RESEARCH:
1. What is ocean acidification?
_________________________________________________________________
_________________________________________________________________

2. What causes ocean acidification?
_________________________________________________________________

3. Current ocean pH: _________ (baseline: 8.15 in 1800)

4. Why do organisms with calcium carbonate shells/skeletons need our concern?
_________________________________________________________________
_________________________________________________________________

MATERIALS:
□ 3 clear jars or cups          □ Shells or chalk pieces (3)
□ Water (3 cups)                □ Vinegar (1 tsp)
□ Baking soda (1/4 tsp)         □ pH test strips
□ Ruler                         □ Camera
□ Labels                        □ Timer

PROCEDURE:
Step 1: Set up three jars:
   Jar 1: "Healthy Ocean" (pH 8.2) - water + baking soda
   Jar 2: "Today's Ocean" (pH 8.1) - plain water
   Jar 3: "Future Ocean" (pH 7.8) - water + vinegar

Step 2: Test and record pH of each solution
Step 3: Add one shell to each jar
Step 4: Observe and record changes every 12 hours for 48 hours
Step 5: Measure and photograph final results

DATA TABLE:

Time | Jar 1 (pH 8.2) Observations | Jar 2 (pH 8.1) Observations | Jar 3 (pH 7.8) Observations
-----|----------------------------|----------------------------|---------------------------
0 hr |                            |                            |
12hr |                            |                            |
24hr |                            |                            |
36hr |                            |                            |
48hr |                            |                            |

QUANTITATIVE DATA (Measurements after 48 hours):
                    Jar 1         Jar 2         Jar 3
Initial mass:      _____ g       _____ g       _____ g
Final mass:        _____ g       _____ g       _____ g
Mass lost:         _____ g       _____ g       _____ g
% mass lost:       _____ %       _____ %       _____ %

OBSERVATIONS:
What did you SEE happening to the shells?
Jar 1 (Healthy): __________________________________________________
Jar 2 (Today): ____________________________________________________
Jar 3 (Future): ___________________________________________________

Were there bubbles? □ Yes □ No    Which jar had the most? __________

GRAPH YOUR RESULTS:
Create a bar graph showing "% Mass Lost" for each pH level

[GRAPH SPACE - draw axes and bars]


ANALYSIS QUESTIONS:

1. Which jar had the most shell damage? Why?
_________________________________________________________________
_________________________________________________________________

2. What chemical reaction occurred? (Hint: CaCO₃ + acid → ?)
_________________________________________________________________

3. If ocean pH drops from 8.1 to 7.8, what % more shell damage would occur?
_________________________________________________________________

4. Which organisms would be most affected by ocean acidification?
_________________________________________________________________
_________________________________________________________________

5. What will happen to ocean food webs if shell-forming plankton can't survive?
_________________________________________________________________
_________________________________________________________________

SOURCES OF ERROR:
What could have affected your results?
1. _______________________________________________________________
2. _______________________________________________________________

CONCLUSION:
Restate your hypothesis: __________________________________________
_________________________________________________________________

Was your hypothesis correct? □ Yes □ No

Summary of findings: ______________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

Real-world implications: __________________________________________
_________________________________________________________________
_________________________________________________________________

What can humans do to reduce ocean acidification?
_________________________________________________________________
_________________________________________________________________

EXTENSION: If you could redesign this experiment, what would you change?
_________________________________________________________________
_________________________________________________________________

Teacher Comments:




Grade: _________ / 100        Teacher Signature: ___________________
`,
      icon: Edit3
    },

    {
      id: 'sea-level-rise-calculator',
      title: 'Sea Level Rise Impact Calculator',
      category: 'Activity',
      grades: '5-10',
      pages: 2,
      description: 'Calculate and visualize sea level rise impacts on coastal communities',
      content: `SEA LEVEL RISE IMPACT CALCULATOR

Name: _________________________ Date: _____________ Location: _____________

PART 1: UNDERSTAND THE SCIENCE

Current sea level rise rate: _____ mm/year (look up for your region)
Global average: 3.4 mm/year (NOAA data)

CONVERSION PRACTICE:
3.4 mm/year = _____ cm/year = _____ inches/year = _____ feet/year

PART 2: CALCULATE FUTURE SEA LEVEL

Starting year: 2025
Starting sea level: 0 cm (baseline)

Fill in the table:

Year | Years Passed | Rise (mm/yr) | Total Rise (cm) | Total Rise (feet)
-----|-------------|--------------|-----------------|------------------
2025 |      0      |     3.4      |       0         |       0
2030 |      5      |     3.4      |                 |
2040 |     15      |     3.4      |                 |
2050 |     25      |     3.4      |                 |
2075 |     50      |     3.4      |                 |
2100 |     75      |     3.4      |                 |

Formula: Total Rise (cm) = (mm/year × years passed) ÷ 10

PART 3: THERMAL EXPANSION VS. ICE MELT

About 50% of sea level rise is from thermal expansion (warming water expands)
About 50% is from melting ice (glaciers, ice sheets)

If sea level rises 25 cm by 2050:
Thermal expansion contribution: _____ cm
Ice melt contribution: _____ cm

PART 4: COMMUNITY IMPACT ASSESSMENT

Research your coastal community (or choose: Miami, NYC, or Bangladesh)

Community: _________________________
Current population: _________________________
Current elevation above sea level: _____ feet

Using NOAA Sea Level Rise Viewer (or estimate):

With 1 foot (30 cm) rise:
- Land area flooded: _____ square miles
- Population affected: _____ people
- Major infrastructure at risk: _________________________________

With 3 feet (90 cm) rise:
- Land area flooded: _____ square miles
- Population affected: _____ people
- Major infrastructure at risk: _________________________________

With 6 feet (180 cm) rise:
- Land area flooded: _____ square miles
- Population affected: _____ people
- Major infrastructure at risk: _________________________________

PART 5: ECONOMIC IMPACT

Estimated cost of sea level rise to your community:

Property damage: $_______________
Infrastructure repair: $_______________
Relocation costs: $_______________
Total estimated cost: $_______________

PART 6: ADAPTATION STRATEGIES

Choose THREE strategies your community could use:

□ Build sea walls (Cost: $________ Effectiveness: ___/10)
□ Raise buildings (Cost: $________ Effectiveness: ___/10)
□ Restore wetlands (Cost: $________ Effectiveness: ___/10)
□ Create living shorelines (Cost: $________ Effectiveness: ___/10)
□ Managed retreat (Cost: $________ Effectiveness: ___/10)
□ Improve drainage (Cost: $________ Effectiveness: ___/10)

Best strategy for your community: _________________________________
Why? ____________________________________________________________
________________________________________________________________

PART 7: PERSONAL ACTION PLAN

What can YOU do to help slow sea level rise?

1. Reduce carbon footprint by: ___________________________________
2. Support policies that: ________________________________________
3. Educate others by: ___________________________________________

REFLECTION:
How will sea level rise affect your life or your children's lives?
________________________________________________________________
________________________________________________________________
________________________________________________________________

What surprised you most about this activity?
________________________________________________________________
________________________________________________________________

Sources used:
1. ________________________________________________________________
2. ________________________________________________________________
`,
      icon: BarChart3
    },

    {
      id: 'marine-ecosystem-food-web',
      title: 'Marine Food Web Design Challenge',
      category: 'Activity',
      grades: '4-8',
      pages: 2,
      description: 'Create and analyze ocean food webs, test species removal impacts',
      content: `MARINE FOOD WEB DESIGN CHALLENGE

Name: _________________________ Date: _____________ Ecosystem: _____________

Choose ONE marine ecosystem:
□ Coral Reef   □ Kelp Forest   □ Open Ocean   □ Mangrove Swamp

PART 1: BUILD YOUR FOOD WEB

List 12-15 organisms in your ecosystem (use reference materials):

PRODUCERS (plants, algae, phytoplankton):
1. _________________________ 4. _________________________
2. _________________________ 5. _________________________
3. _________________________

PRIMARY CONSUMERS (herbivores):
1. _________________________ 4. _________________________
2. _________________________ 5. _________________________
3. _________________________

SECONDARY CONSUMERS (small predators):
1. _________________________ 3. _________________________
2. _________________________ 4. _________________________

TERTIARY CONSUMERS (large predators):
1. _________________________ 3. _________________________
2. _________________________

DECOMPOSERS:
1. _________________________ 2. _________________________

PART 2: DRAW YOUR FOOD WEB

In the space below, draw your organisms and connect them with arrows
Arrows point from "eaten" to "eater" (energy flow direction)

[LARGE DRAWING SPACE]


PART 3: IDENTIFY KEY SPECIES

Keystone species (most connected): _______________________________
Why is this species so important? ________________________________
________________________________________________________________

Most vulnerable species (least connected): ________________________
Why is this species vulnerable? ___________________________________

PART 4: TROPHIC CASCADE EXPERIMENT

Scenario 1: Remove the TOP PREDATOR
Species removed: _________________________________________________

What happens to:
- Secondary consumers: ____________________________________________
- Primary consumers: ______________________________________________
- Producers: _____________________________________________________
- Overall ecosystem health: _______________________________________

Scenario 2: Remove a KEY HERBIVORE
Species removed: _________________________________________________

What happens to:
- Producers: _____________________________________________________
- Predators that ate this species: _________________________________
- Competing herbivores: ___________________________________________
- Overall ecosystem health: _______________________________________

Scenario 3: Lose 50% of PRODUCERS (climate change/pollution)

What happens to:
- Primary consumers: ______________________________________________
- Secondary consumers: ____________________________________________
- Tertiary consumers: _____________________________________________
- Overall ecosystem health: _______________________________________

PART 5: HUMAN IMPACTS

How do these threats affect your food web?

OVERFISHING:
Species most affected: ____________________________________________
Cascade effect: __________________________________________________
________________________________________________________________

POLLUTION (plastic, oil, chemicals):
Species most affected: ____________________________________________
Cascade effect: __________________________________________________
________________________________________________________________

CLIMATE CHANGE (warming, acidification):
Species most affected: ____________________________________________
Cascade effect: __________________________________________________
________________________________________________________________

HABITAT DESTRUCTION (coral bleaching, kelp loss):
Species most affected: ____________________________________________
Cascade effect: __________________________________________________
________________________________________________________________

PART 6: CONSERVATION SOLUTIONS

Design a protection plan for your ecosystem:

Protected area size needed: _____ square miles

Species to protect first (priority order):
1. _________________________ Why: ________________________________
2. _________________________ Why: ________________________________
3. _________________________ Why: ________________________________

Fishing regulations needed: ______________________________________
________________________________________________________________

Pollution controls needed: _______________________________________
________________________________________________________________

Climate action needed: ___________________________________________
________________________________________________________________

PART 7: ENERGY FLOW CALCULATIONS

If producers have 10,000 units of energy:
Primary consumers get: _____ units (10% rule)
Secondary consumers get: _____ units
Tertiary consumers get: _____ units

Why does energy decrease at each level?
________________________________________________________________
________________________________________________________________

REFLECTION:
What would happen to your ecosystem without any predators?
________________________________________________________________
________________________________________________________________

Why is biodiversity important for ecosystem stability?
________________________________________________________________
________________________________________________________________

How can humans help restore damaged food webs?
________________________________________________________________
________________________________________________________________

Teacher/Parent Signature: _________________ Score: _____ / 100
`,
      icon: BookOpen
    },

    {
      id: 'coastal-protection-plan',
      title: 'Coastal Protection Design Project Rubric',
      category: 'Rubric',
      grades: '5-10',
      pages: 2,
      description: 'Assessment rubric and planning template for coastal protection projects',
      content: `COASTAL PROTECTION DESIGN PROJECT - RUBRIC & PLANNING TEMPLATE

Student Name: _________________________ Date: _____________

PROJECT OVERVIEW:
Design a coastal protection plan for a fictional (or real) coastal community threatened by erosion and sea level rise.

PLANNING TEMPLATE:

Community Profile:
Name: _____________________________ Population: _____________
Current challenges: ______________________________________________
________________________________________________________________

Budget: $_______________  Timeline: _____ years

Protection Methods Selected (choose 2-3):
□ Seawalls        Cost: $_______ Pros: ____________ Cons: ____________
□ Groynes         Cost: $_______ Pros: ____________ Cons: ____________
□ Beach nourishment  Cost: $_____ Pros: ____________ Cons: ____________
□ Sand dunes      Cost: $_______ Pros: ____________ Cons: ____________
□ Living shorelines  Cost: $_____ Pros: ____________ Cons: ____________
□ Managed retreat    Cost: $_____ Pros: ____________ Cons: ____________

Total cost of plan: $_______________

Environmental impact assessment:
Wildlife affected: ________________________________________________
Habitat changes: _________________________________________________
Long-term sustainability: _________________________________________

GRADING RUBRIC:

CRITERIA 1: Scientific Accuracy (25 points)
□ Advanced (23-25): Explains all methods correctly with scientific terminology
□ Proficient (18-22): Most methods accurate, minor errors
□ Developing (13-17): Some inaccuracies in understanding
□ Beginning (0-12): Major misconceptions

Score: _____ / 25
Comments: _______________________________________________________

CRITERIA 2: Environmental Consideration (25 points)
□ Advanced (23-25): Thoroughly considers ecosystem impacts, balances protection with ecology
□ Proficient (18-22): Considers environment in most decisions
□ Developing (13-17): Limited environmental thinking
□ Beginning (0-12): No environmental consideration

Score: _____ / 25
Comments: _______________________________________________________

CRITERIA 3: Feasibility & Budget (20 points)
□ Advanced (18-20): Realistic budget, timeline, and resource allocation
□ Proficient (14-17): Mostly feasible with minor unrealistic elements
□ Developing (10-13): Several unrealistic elements
□ Beginning (0-9): Not feasible

Score: _____ / 20
Comments: _______________________________________________________

CRITERIA 4: Visual Communication (15 points)
□ Advanced (14-15): Clear, detailed diagrams with labels and legend
□ Proficient (11-13): Adequate visuals, mostly clear
□ Developing (8-10): Minimal or unclear visuals
□ Beginning (0-7): No visuals or incomprehensible

Score: _____ / 15
Comments: _______________________________________________________

CRITERIA 5: Written Explanation (15 points)
□ Advanced (14-15): Clear, organized, thorough explanation
□ Proficient (11-13): Adequate explanation with minor gaps
□ Developing (8-10): Incomplete or unclear explanation
□ Beginning (0-7): Minimal or no explanation

Score: _____ / 15
Comments: _______________________________________________________

TOTAL SCORE: _____ / 100

GRADE: _____

TEACHER FEEDBACK:
Strengths: _______________________________________________________
________________________________________________________________

Areas for improvement: ___________________________________________
________________________________________________________________

Extension challenge: _____________________________________________
________________________________________________________________

Teacher Signature: _________________ Date: _____________

STUDENT REFLECTION:
What was the hardest part of this project?
________________________________________________________________

What did you learn about coastal protection?
________________________________________________________________

Would your plan work in real life? Why or why not?
________________________________________________________________
`,
      icon: FileText
    }
  ];

  // Generate downloadable text file
  const downloadWorksheet = (worksheet) => {
    const element = document.createElement('a');
    const file = new Blob([worksheet.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${worksheet.title.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Print worksheet
  const printWorksheet = (worksheet) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${worksheet.title}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 0.5in auto;
              padding: 0.5in;
            }
            h1 { text-align: center; font-size: 18pt; margin-bottom: 20px; }
            pre { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 10pt; }
            @media print {
              body { margin: 0; padding: 0.5in; }
            }
          </style>
        </head>
        <body>
          <h1>${worksheet.title}</h1>
          <pre>${worksheet.content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Printable Ocean Worksheets
        </h1>
        <p className="text-xl text-gray-700 mb-3">
          Classroom-Ready Educational Materials
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Download or print these worksheets for hands-on ocean science learning.
          All materials are aligned with experiments and lesson plans.
        </p>
      </div>

      {/* Worksheet Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {worksheets.map((worksheet, index) => {
          const Icon = worksheet.icon;
          return (
            <motion.div
              key={worksheet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
            >
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6">
                <Icon className="w-12 h-12 mb-3" />
                <h3 className="text-xl font-bold mb-2">{worksheet.title}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-white/20 px-2 py-1 rounded">
                    {worksheet.category}
                  </span>
                  <span className="bg-white/20 px-2 py-1 rounded">
                    Grades {worksheet.grades}
                  </span>
                  <span className="bg-white/20 px-2 py-1 rounded">
                    {worksheet.pages} {worksheet.pages === 1 ? 'page' : 'pages'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4 text-sm">
                  {worksheet.description}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadWorksheet(worksheet)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => printWorksheet(worksheet)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </button>
                </div>

                <button
                  onClick={() => setSelectedWorksheet(selectedWorksheet === worksheet.id ? null : worksheet.id)}
                  className="w-full mt-2 text-blue-600 hover:text-blue-700 font-bold text-sm"
                >
                  {selectedWorksheet === worksheet.id ? 'Hide Preview' : 'Show Preview'}
                </button>

                {selectedWorksheet === worksheet.id && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {worksheet.content.substring(0, 500)}...
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Usage Instructions */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-6">How to Use These Worksheets</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-3">For Teachers:</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Download as .txt files and convert to your preferred format</li>
              <li>✓ Print directly from your browser</li>
              <li>✓ Modify content to fit your classroom needs</li>
              <li>✓ Pair with experiments and lesson plans</li>
              <li>✓ Use for formative and summative assessment</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">For Students/Parents:</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Print worksheets for at-home experiments</li>
              <li>✓ Complete data sheets during activities</li>
              <li>✓ Use rubrics for self-assessment</li>
              <li>✓ Keep in science notebook or binder</li>
              <li>✓ Share completed work with teachers</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-white/20 rounded-lg p-4">
          <p className="text-sm">
            <strong>Note:</strong> All worksheets are provided as plain text files (.txt) for maximum compatibility.
            You can copy the content into Microsoft Word, Google Docs, or any text editor to customize formatting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OceanWorksheets;
