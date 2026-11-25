### **MVP Validation Findings & Refactoring Priorities Form**

#### **Section 1 — Project Information**

1. **Team/Group Name:** PAMANA Team (Team Code: 2526-sem2-it332-33)  
2. **Project/System Title:** PAMANA: Heritage Quest – Gamified Filipino Language Learning System for Grade 2 Generation Alpha Learners  
3. **Program / Section:** BS Information Technology \- IT411  
4. **Team Members**  
   * Kyle Ed C. Maningo  
   * Rudyard Axel L. Gersamio  
   * Sharaine Allyson A. Salutan  
   * Lyndon Luke A. Morre  
   * Kobe Vincent L. Marikit  
5. **Adviser:** Dr. Cheryl B. Pantaleon  
6. **System URL / MVP Link:**  
   * Frontend Application: [https\://pamana-heritage-quest.vercel.app](https://pamana-heritage-quest.vercel.app/)  
   * Backend REST API: [https\://pamana-heritage-quest.up.railway.app/api](https://pamana-heritage-quest.up.railway.app/api)  
   * GitHub Repository: [https\://github.com/KobeVLM/PAMANA](https://github.com/KobeVLM/PAMANA)  
7. **Date of MVP Validation:** November 18, 2026 (Round 1 MVP User Validation)  
8. **Number of respondents/participants:** 15 Total Participants (12 Student Learners, 2 Parent Observers, 1 Filipino Subject Matter Expert Teacher)  
9. **Types of respondents involved**  
   * Customer: Parents / Guardians ($N=2$)   
   * End User: Grade 2 Generation Alpha Primary School Learners ($N=12$)   
   * Subject Matter Expert: DepEd Grade 2 Filipino Subject Teacher ($N=1$, Mrs. Eleanor Sindangan)  
   * Decision Maker: School Principal (Mrs. Genabel V. Patrimonio)  
   * Other: \_\_\_\_\_\_\_\_

---

#### **Section 2 — MVP Validation Overview**

**1\. What was the primary purpose of your MVP validation?**

> The primary purpose of the Round 1 MVP Validation was to evaluate the foundational usability, instructional clarity, gameplay engagement, and curricular alignment of the PAMANA learning system with real target users. Specifically, the validation investigated how effectively Grade 2 Generation Alpha learners can independently navigate the Pamana Trail and engage with core game mechanics—including syllable blending (Pagsama), syllable recognition (Pakinggan/Kilalanin), the 4-step spiral vocabulary loop (Pakinggan-Kilalanin-Basahin-Gamitin), and basic sentence construction (Bumuo ng Pangungusap)—guided by native Filipino audio voiceovers (Lolo and Lola). Concurrently, the validation aimed to verify whether parents and teachers find the educational flow, automated progress tracking, and supportive feedback pedagogically sound and easy to follow.

**2\. What validation framework/model did your team use?**

* Framework/Model: Usability, Pedagogy, and Accessibility (UPA)  
* Key constructs/criteria evaluated:  
  * *Usability (U):*  
    * Item 1 (Navigation): The Pamana Trail map, module menus, and stage progression are clearly organized and simple to navigate.  
    * Item 2 (Responsiveness): Interactive elements (drag-and-drop, selection cards, audio buttons) are responsive and function without lag or friction.  
    * Item 3 (Feedback cues): The system immediately provides clear and appropriate visual/auditory cues when an answer is correct, incorrect, or loading.  
    * Item 4 (Visual consistency): Buttons, icons, typography, and visual cues maintain a consistent style and placement across all modules.  
    * Item 15 (Uncluttered layout): Screen layouts are uncluttered and avoid excessive visual elements that could distract early-grade learners.  
    * Item 16 (Touch target size): Clickable areas, draggable cards, and buttons are generously sized for young children with developing motor coordination.  
    * Item 6 (Parent dashboard / reports): The Parent Dashboard and downloadable PDF reports provide clear, actionable summaries of learner progress.  
    * Child Survey Q1 (Easy & fun): *"Was PAMANA easy and fun for you to click and play?"* (Yes rate: 91.7%)  
    * Child Survey Q6 (Pictures/letters clear): *"Were the pictures and letters big, clear, and easy for your eyes to see?"* (Yes rate: 83.3%)  
    * Child Survey Q7 (Would play again): *"Would you like to play and learn with PAMANA again?"* (Yes rate: 75.0%)  
  * *Pedagogy (P):*  
    * Item 7 (MATATAG alignment): The learning tasks (syllable blending, spiraled vocabulary, sentence construction) align with MATATAG Grade 2 Filipino competencies.  
    * Item 8 (4-step loop \- PKBG): The structured 4-step loop (*Pakinggan-Kilalanin-Basahin-Gamitin*) facilitates logical and progressive language learning.  
    * Item 5 (Supportive prompts on errors): When an incorrect response is made, the app provides supportive prompts to guide the user rather than penalizing or confusing them.  
    * Item 12 (Active recall \- not guessing): Activities encourage active vocabulary recall and comprehension rather than random guessing.  
    * Item 9 (Narrative quests and rewards): Narrative quests (*Pamanang Gawain* with Lolo and Lola) and quest rewards effectively engage and motivate young learners.  
    * Item 10 (Cultural awareness): The narrative setting (visiting grandparents in the province) effectively fosters Filipino cultural awareness and appreciation.  
    * Child Survey Q3 (Helped learn words): *"Did the game help you learn and understand new Filipino words?"* (Yes rate: 66.7%)  
    * Child Survey Q4 (Understood questions): *"Did you understand the questions and activities in the game?"* (Yes rate: 58.3%)  
    * Child Survey Q5 (Understood feedback): *"Did you understand the feedback shown after you answered a question?"* (Yes rate: 66.7%)  
  * *Accessibility (A):*  
    * Item 14 (Audio support for low readers): Spoken audio instructions adequately support learners who have limited initial reading proficiency.  
    * Item 11 (Voiceover quality): Native Filipino voiceovers demonstrate accurate pronunciation, natural cadence, and appropriate pacing for early learners.  
    * Item 13 (Typography and contrast): Typography, font sizing, and visual contrast are clear, comfortable, and age-appropriate for 7–8 year old children.  
    * Item 17 (Onboarding for English-speaking learners): The onboarding flow and guidance accommodate learners who primarily speak English or are culturally disconnected at home.  
    * Child Survey Q2 (Voices clear): *"Were the voices of Lolo and Lola clear and easy for you to hear?"* (Yes rate: 75.0%)  
  *   
* Why was this framework/model appropriate for your project?

> The **UPA (Usability, Pedagogy, and Accessibility) Framework** was selected because evaluating early-childhood educational technology requires a specialized, multi-dimensional assessment that goes beyond simple software usability. Unlike generic applications, early-literacy educational games must satisfy a balanced triad:

> 1. **Usability (U):** Ensures that 7–8 year old Generation Alpha learners and their parents can independently navigate the Pamana Trail, interact with drag-and-drop elements, and follow game loops without technical friction.  
> 2. **Pedagogy (P):** Directly verifies curricular alignment with DepEd MATATAG Grade 2 Filipino competencies, ensuring that the 4-step spiral progression (*Pakinggan-Kilalanin-Basahin-Gamitin*) and active recall mechanics reinforce genuine language acquisition rather than random guessing.  
> 3. **Accessibility (A):** Evaluates whether native Filipino voiceovers, spoken instructions, high-contrast typography, and large click targets adequately support emergent readers who have developing motor skills and limited initial reading proficiency.

> Standard software evaluation models only measure general efficiency and user satisfaction, whereas the UPA framework validates whether PAMANA succeeds both as an engaging digital experience and as an effective early-grade literacy learning tool.

**3\. Briefly describe how the validation was conducted.**

Include:

* Who participated: 12 primary grade learners (11 Grade 2 learners from "Grade 2 \- Hope" and 1 Grade 1 learner), 2 parent observers, and 1 CIT-U Elementary Grade 2 Filipino classroom teacher (Mrs. Eleanor Sindangan).  
* How they interacted with the MVP: Learners interacted directly with the PAMANA web application on desktop computer workstations using mouse navigation, exploring the learning modules at their own pace.  
* What activities/tasks they performed: Learners logged into student accounts, traversed the Pamana Trail map, and played through Module 1 (syllable blending and matching), Module 2 (Self & Body vocabulary spiral loops), and basic sentence construction. Observers and the teacher observed learner interactions, noting areas of hesitation, engagement, and spontaneous reactions.  
* How feedback/data was collected: Right after the gameplay session, the team prepared digital survey questionnaires using Microsoft Forms on the computer workstations for the learners and adult evaluators to answer, exactly as compiled in PAMANA\_Round1\_Summary-2.xlsx. For the young student testers, the team actively facilitated the process—patiently guiding them through the Microsoft Forms interface and assisting them in understanding each question whenever they needed help or clarification, ensuring that emergent readers could accurately express their genuine feedback. The data collection instruments comprised:

  * 7-item Child Feedback Questionnaire: Administered via Microsoft Forms immediately post-play, measuring Q1 (Easy & fun), Q2 (Voices clear), Q3 (Helped learn words), Q4 (Understood questions), Q5 (Understood feedback), Q6 (Pictures/letters clear), Q7 (Would play again), and an open-ended question on their favorite character/element.

  * 17-item Evaluator Observation Checklist: Completed via Microsoft Forms by parent observers and the Filipino teacher on a 5-point Likert scale (Strongly agree \= 5 to Strongly disagree \= 1), evaluating Items 1–17 across the UPA dimensions.

  * Evaluator Qualitative Comments: Open-ended feedback capturing observed difficulties, engaging elements, and recommendations for improvement.

---

# **Section 3 — MVP Validation Findings**

**Instruction:** Identify the **most significant findings** from your MVP validation. Do not simply list bugs, cosmetic changes, or minor UI/UX comments. Focus on findings that have implications for the system's ability to achieve its **SMART objectives and measurable outcomes**.

### **Finding \#1 :** 

**1\. What did you learn from the stakeholders?**  
*While overall student engagement was exceptionally high (91.7% found PAMANA easy and fun, and 91.7% expressed strong affection for Lolo and Lola), comprehension of instructional prompts and feedback cues was the weakest area for children. More than 41% of learners were confused or unsure about what the game activities asked them to do, and 33.3% did not clearly understand the feedback displayed after answering. A distinct cluster of 5 out of 12 students answered "Yes" to 4 or fewer questions across the survey. The current MVP relies heavily on brief written instructions and simple sound chimes; without interactive visual onboarding (such as animated demonstration cursors) and visual explanations when an error occurs, early-grade learners experience cognitive friction and uncertainty.*

**2\. What evidence supports this finding?**

* **Child Feedback Survey (Q4 \- Understood Questions)**: Only 58.3% Yes (7/12), with 33.3% "Not sure" (4/12) and 8.3% "No" (1/12)—the lowest rating among all student survey questions.

* **Child Feedback Survey (Q5 \- Understood Feedback)**: Only 66.7% Yes (8/12), with 16.7% "Not sure" (2/12) and 16.7% "No" (2/12).

* **Participant Cluster Pattern**: Five learners (kid01, kid02, kid03, kid09, and student \#12) answered "Yes" to 4 or fewer questions, showing that instruction comprehension issues clustered heavily among struggling emergent readers.

* Evaluator Observation Checklist (Item 15 \- Uncluttered Layout): Rated 3.0 / Neutral by the Filipino teacher, indicating that the visual layout during active gameplay lacked sufficient instructional focus and visual guidance for early-grade learners.

**3\. Which stakeholder/user type provided this feedback?**

* End User (Grade 2 Learners)  
* SME ((Filipino Teacher)

**4\. Which SMART objective or measurable outcome is affected?**

* Objective 1 (Syllable Recognition): Achieving $\geq 80%$ syllable accuracy across sub-levels before progression unlocks.  
* Objective 2 (Vocabulary Development): Achieving $\geq 75%$ mastery accuracy per word across all 4 spiral steps.  
* Objective 3 (Sentence Construction): Achieving $\geq 75%$ sentence construction accuracy.

**5\. What measurable outcome could potentially be improved?**

* Accuracy  
* Efficiency  
* Effectiveness  
* Usability  
* User satisfaction

**6\. Explain how the finding affects the achievement of the objective.**

*The core learning model of PAMANA relies on active recall and self-paced mastery. When young learners do not understand the instructions or what their error was, they cannot engage in meaningful reflection or self-correction. Instead, they resort to trial-and-error clicking until the game advances. This causes artificial error spikes, inflates attempt counts in database records, and prevents struggling learners from achieving the target $\geq 75%$ and $\geq 80%$ mastery thresholds required to unlock succeeding modules.*

---

### **Finding \#2**

**1\. What did you learn from the stakeholders?**  
The validation identified that the application's in-game audio delivery lacks supportive scaffolding for emergent readers who have limited reading skills. In the current interface, voiceovers and phoneme sounds trigger automatically only once upon loading an item. There is no prominent in-app repeat listening control, no synchronized visual dialogue captions, and no pacing controls. As a result, 25% of children indicated that the voices were not clear or easy to hear, and the Filipino teacher rated spoken audio support for low readers as Neutral (3.0/5.0). Observer 2 similarly reported that their child had difficulty listening to and processing the audio prompts during gameplay. 

**2\. What evidence supports this finding?**

* **Child Feedback Survey (Q2 \- Voices Clear):** Only 75.0% Yes (9/12), while 25.0% (3/12) responded non-positively (1 "Just okay", 2 "No").  
* **Evaluator Observation Checklist (Item 14 \- Audio Support for Low Readers)**: Rated 3.0 / Neutral by the Filipino teacher (the lowest rating on her checklist), indicating that the system's spoken audio does not sufficiently support children with limited reading ability.  
* **Parent Observation (Observer 2\)**: Rated voiceover pacing/quality 4.0 and noted in observed difficulties: *"with the audio sometimes my child had trouble listening to them."*  
* **Evaluator Observation Checklist (Item 11 \- Voiceover Quality)***: Rated 4.0 (Agree) by Observer 2 and the Filipino teacher. Adults rated the voices acceptable overall, but the learners who depend on the audio rated clarity lower (Q2: 75.0%), and the team's own review of the recorded clips found words that are pronounced incorrectly, so children cannot fully understand them.*  
* 

**3\. Which stakeholder/user type provided this feedback?**

* Customer (Parents)  
* End User (Grade 2 Learners)  
* SME (Filipino Teacher)

**4\. Which SMART objective or measurable outcome is affected?**

* Objective 1 (Syllable Mastery \- Pakinggan at Kilalanin): Deliver native audio playback of Filipino phonemes and CV syllables with $\leq 0.3s$ response to build syllable recognition accuracy.  
* Objective 2 (Vocabulary 4-Step Spiral Loop): Execute Step 1 (*Pakinggan*) receptive audio exposure and Step 4 (*Gamitin*) dialogue comprehension.

**5\. What measurable outcome could potentially be improved?**

* Effectiveness  
* Usability  
* User satisfaction  
* Auditory Accessibility & Scaffolding

**6\. Explain how the finding affects the achievement of the objective.**

*Grade 2 Generation Alpha learners \- especially those who are culturally or linguistically disconnected from Filipino at home \- rely heavily on audio cues to connect spoken phonemes to written syllables. If an audio prompt plays only once without a prominent in-game replay button or synchronized visual speech bubbles, a learner who hesitates or misses the initial sound is left without guidance. This directly impairs their ability to accomplish syllable blending and vocabulary matching independently.*

### **Finding \#3**

**1\. What did you learn from the stakeholders?**  
*Both the parent evaluators and the Filipino teacher observed that the learning content is structured around a static, uniform difficulty level across the 25 vocabulary words and syllable exercises. Learners who progress quickly encounter no advanced challenges, while emergent learners who struggle receive the identical distractor options repeatedly. Observer 2 explicitly recommended introducing "more questions with varying types of difficulty," and teacher feedback underscored the need for differentiated learning content to accommodate learners with varying baseline reading proficiencies.*

**2\. What evidence supports this finding?**

* **Observer 2 Recommendation:** Specifically recommended: *"proper audio, more questions with varying types of difficulty."*  
* **Teacher Curricular Feedback**: Emphasized the value of the missing-syllables and vocabulary features, but noted that children exhibit wide variations in Filipino familiarity that require broader item coverage.  
* **Evaluator Observation Checklist (Items 8, 9,11)**: Scored 4.0 (Agree) by both Observer 2 and the Filipino teacher, reflecting that while the 4-step loop and narrative quests are well-structured, the system would benefit from greater content depth and progressive challenge tiers.

**3\. Which stakeholder/user type provided this feedback?**

* Customer (Parents)  
* SME ((Filipino Teacher)

**4\. Which SMART objective or measurable outcome is affected?**

* **Objective 2 (Vocabulary Spiraling & Hamon ng Pamana)**: Maintaining $\geq 80%$ engagement and retention across multi-week practice.  
* **Objective 5 (Classroom / Klase Mode)**: Providing meaningful instructional utility for diverse classroom cohorts.

**5\. What measurable outcome could potentially be improved?**

* Effectiveness  
* Usability  
* User satisfaction  
* Other: Curricular Scalability & Differentiated Learning

**6\. Explain how the finding affects the achievement of the objective.**

*A static question set with fixed distractors limits educational efficacy. Advanced learners may achieve quick mastery through simple recognition, while struggling learners may experience frustration when presented with phonetically complex distractors too early. Implementing difficulty tiers ensures that learners receive appropriate scaffolding, directly supporting sustained engagement and higher vocabulary retention over time.*

> 

---

# **Section 4 — Potential Refactoring Priorities**

This is the **most important section of the form**.

For each significant finding, identify what should potentially be changed in the system's **requirements and/or design**.

### **Refactoring Priority \#1**

**1\. Validation Finding**

*Reference Finding \#\_1\_ from Section 3\.*

Cognitive Friction in Task Instructions and Corrective Feedback Scaffolding. 

**2\. What needs to be improved or changed?**

*Refactor the instructional delivery and feedback loops across all learning modules:* 

*(a) replace static text instructions with interactive micro-tutorials (e.g., an animated pointing hand illustrating drag-and-drop or card selection);*   
*(b) implement progressive, scaffolded error guidance that visually narrows choices rather than presenting generic retry messages; and*   
*(c) simplify active game screens into a distraction-free "Focus View".*

**3\. What type of refactoring is required?** 

* Functional requirement  
* System process/workflow  
* Usability

**4\. Current MVP approach**

*The MVP displays a brief text instruction at the top of the screen and plays a single voice line. On an incorrect answer, a red border and generic "Subukan muli" alert appear, only showing the correct answer after 3 consecutive failed attempts.*

**5\. Proposed refactored approach**

1. *Interactive Hand-Cursor Demonstration: Upon entering any new game mechanic (Pagsama, Spiral Matching, Bumuo ng Pangungusap), display an animated finger cursor demonstrating the action for 2 seconds before user interaction begins.*  
2. *3-Stage Progressive Error Scaffolding:*  
   1. *Attempt 1: Soft highlight on the chosen card, gentle audio encouragement ("Halos nakuha mo na\! Pakinggan nating muli..."), and replay of the target sound.*  
   2. *Attempt 2: Visually fade out one incorrect distractor card, reducing choices from 4 to 3\.*  
   3. *Attempt 3: Display side-by-side visual comparison of the target syllable/word with clear vocal explanation ("Ang B at A ay BA"), then allow the child to click to confirm.*  
3. *Focus View Gameplay Screen: Declutter active game screens by hiding non-interactive background elements and trail progress icons during active question answering, keeping visual attention centered on the learning cards.*

**6\. Why is this change necessary?**

*Over 41% of learners were uncertain of question expectations, and 33% did not understand feedback cues. Grade 2 emergent readers cannot decode dense text. Interactive visual demonstrations and scaffolded distractor elimination directly reduce cognitive overload, eliminate blind guessing, and guide learners toward genuine active recall.*

**7\. Expected improvement**

*Child question understanding (Q4) increasing from 58.3% to $\geq 85.0%$; child feedback understanding (Q5) increasing from 66.7% to $\geq 85.0%$; Teacher Checklist Item 15 (Layout) improving from 3.0 to $\geq 4.5$.*

**8\. How will the improvement eventually be measured?**

* Child Feedback Questionnaire (Q4 and Q5 Yes rate $\geq 85%$)

* In-app telemetry: Average incorrect attempts per item before success (target $\leq 1.4$)

* Teacher observation rating on layout clarity ($\geq 4.5/5.0$)

**9\. Priority**

* 🔴 High — Essential to achieving a SMART objective

### **Refactoring Priority \#2**

**1\. Validation Finding**

*Reference Finding \#\_2\_ from Section 3\.*

In-Game Auditory Guidance & Scaffolding Limitations for Emergent Readers. 

**2\. What needs to be improved or changed?**

*Refactor in-game audio delivery by: (a) adding a prominent, pulse-animated "Makinig Ulit" (Audio Replay) button on all interactive screens; (b) displaying synchronized visual speech dialogue bubbles for all NPC voice lines; and (c) normalizing audio volume levels across all pre-recorded sound clips.*

**3\. What type of refactoring is required?** 

* Non-functional requirement  
* System process/workflow  
* Usability  
* Other: *Auditory Accessibility*

**4\. Current MVP approach**

*Audio clips play automatically once on question load. The speaker icon is small, and if a child misses the initial audio cue, there is no visual text transcript or prominent prompt reminding them they can listen again.*

**5\. Proposed refactored approach**

1. *Prominent Audio Replay Component:* Add an oversized ($\geq 56px$), high-contrast speaker button with a gentle pulsing animation located at the center top of every activity, enabling instant replay with $\leq 0.1s$ latency.  
2. *Synchronized Visual Speech Bubbles:* Accompany every spoken line from Lolo or Lola with a high-contrast speech bubble displaying the spoken words in large, readable font (minimum 24pt), allowing children to read along while listening.  
3. *Audio Level Normalization:* Normalize all voiceover .mp3 assets in the backend repository to a consistent peak level ($-1.0dBFS$) with clear vocal equalization to ensure uniform loudness across all modules.

**6\. Why is this change necessary?**

*Spoken audio is the primary instructional bridge for Grade 2 learners who cannot yet read fluently. Providing on-demand replay and synchronized visual captions ensures that children who miss an initial cue can self-correct without getting stuck or guessing blindly.*

**7\. Expected improvement**

*Child voice clarity rating increasing from 75.0% to $\geq 90.0%$; Teacher Checklist Item 14 (Audio Support for Low Readers) improving from 3.0 (Neutral) to $\geq 4.5$.*

**8\. How will the improvement eventually be measured?**

* Child Feedback Questionnaire (Q2 Yes rate $\geq 90%$)

* Observer checklist rating on Item 14 ($\geq 4.5/5.0$)

* In-app telemetry tracking frequency of replay button usage

**9\. Priority**

* 🔴 High — Essential to achieving a SMART objective

### **Refactoring Priority \#3**

**1\. Validation Finding**

*Reference Finding \#\_3\_ from Section 3\.*

Static Content Rigidity and Lack of Graded Difficulty Tiers. 

**2\. What needs to be improved or changed?**

*Refactor the question data model and game loop logic to support three progressive difficulty tiers (Madali / Katamtaman / Mahirap) for vocabulary and syllable tasks, and structure items into a modular Content Bank in the database.*

**3\. What type of refactoring is required?** 

* Functional requirement  
* System architecture/design  
* Data/input/output  
* Algorithm/method

**4\. Current MVP approach**

*Vocabulary words and syllable exercises are hardcoded in static arrays with fixed distractors. Every learner receives the exact same item sequence regardless of individual proficiency.*

**5\. Proposed refactored approach**

1. *Tiered Schema Design: Update the database schema to include difficulty\_tier (FOUNDATIONAL, STANDARD, CHALLENGE) and structured distractor pools:*  
   1. *Foundational Tier: Distractors have completely different initial consonants (e.g., target BA, distractors KO, MI, TU), making identification easier for beginners.*  
   2. *Standard Tier: Distractors share similar vowel sounds (e.g., target BA, distractors BE, BI, BO).*  
   3. *Challenge Tier: Syllables presented within multi-syllable word contexts or 3-letter CVC patterns.*  
2. *Dynamic Question Dispatcher: Update backend services to select distractors adaptively based on the learner's previous attempt history.*

**6\. Why is this change necessary?**

*Parent evaluators and educators emphasized the need for varying difficulty levels to accommodate diverse learners. Differentiated difficulty prevents early learner frustration while keeping advancing learners engaged, directly supporting long-term vocabulary retention.*

**7\. Expected improvement**

*Improved learning progression across varying ability levels; higher engagement across repeated sessions; teacher satisfaction with curricular flexibility reaching $\geq 90%$.*

**8\. How will the improvement eventually be measured?**

* Evaluator rating on content progression and challenge ($\geq 4.5/5.0$)

* Longitudinal learner retention and completion rates across multi-week sessions ($\geq 85%$)

**9\. Priority**

* 🟠 Medium — Significant improvement to the system

### **Refactoring Priority \#4**

**1\. Validation Finding**

*Reference Finding \#\_1\_ from Section 3\.*

Unclear and Discouraging Progress Feedback.

**2\. What needs to be improved or changed?**

*Refactor the progress bar and progress tracking so that every correct answer immediately and visibly adds to overall progress, computed as the percentage of distinct items answered correctly at least once over total items. Progress should be clearly reflected, accurately saved, and encouraging rather than frustrating for children.*

**3\. What type of refactoring is required?**

●       Functional requirement  
●      System process/workflow  
●      Usability

**4\. Current MVP approach**

*At times, the progress bar does not increase even when a child gives a correct answer, so correct answers are not always reflected as progress or rewarded with immediate positive feedback.*

**5\. Proposed refactored approach**

1. *Automatic, Answer-Based Progress Bar: The bar fills in proportion to distinct items solved at least once divided by total items, with an animated increment and a short positive audio cue each time a child answers correctly. The bar stays visible during Focus View (Refactoring Priority \#1) so progress is never hidden while a child answers.*  
2. *Encouraging Progress Rules: A wrong attempt never reduces the bar; it triggers the scaffolded hints from Refactoring Priority \#1 instead, keeping the experience positive and less frustrating.*  
3. *Honest Persistence, Two Separate Numbers: Save every answer to an append-only answer log so the bar can be recomputed from distinct solved items. The bar is a progress measure; the Parent Dashboard reports accuracy from the mastery records. Both are displayed in the HUD as separate values instead of being forced to match.*

**6\. Why is this change necessary?**

*Young learners need immediate, visible proof that their answers count. Delayed, unclear, or inaccurate progress feedback contributes to the frustration and blind guessing observed in Finding \#1, where only 66.7% of children clearly understood the feedback shown after answering. The intermittent failure of the bar to update on correct answers is also a functional defect that this refactoring corrects.*

**7\. Expected improvement**

*Child feedback understanding (Q5) increasing from 66.7% to ≥85.0%; engagement (Q1) and replay intent (Q7) maintained or improved; progress shown on screen matching saved records in all sessions.*

**8\. How will the improvement eventually be measured?**

●       Child Feedback Questionnaire (Q5 Yes rate ≥85%; Q1 and Q7 maintained or improved)

●       In-app telemetry: displayed progress equals distinct items solved ÷ total items in 100% of sessions

●       Observer checklist ratings on Item 3 (Feedback cues) and Item 5 (Supportive prompts on errors)

**9\. Priority**

●      🟠 Medium — Significant improvement to the system

### **Refactoring Priority \#5**

**1\. Validation Finding**

*Reference Finding \#\_2\_ from Section 3\.*

Voice Narration Clarity and Pronunciation Accuracy.

**2\. What needs to be improved or changed?**

*Review all voice narration used throughout the system and replace the existing voices with clearer, more child-friendly options. Improve pronunciation accuracy so that words and instructions are pronounced correctly, clearly, and naturally for young learners.*

**3\. What type of refactoring is required?**

●       Non-functional requirement  
●      Usability  
●      Other: Auditory Accessibility

**4\. Current MVP approach**

*The voice narration currently uses recorded audio. Some words and instructions are pronounced incorrectly, so children cannot fully understand what is being said.*

**5\. Proposed refactored approach**

1. *Narration Audit: Review every voiceover clip against a pronunciation and clarity checklist, validated by the Filipino subject teacher.*  
2. *Voice Replacement: Re-record or replace failing clips with clearer, warmer, child-friendly native Filipino voices for Lolo and Lola, at a slower, age-appropriate pace.*  
3. *Consistent Audio Quality: Apply the peak-level normalization from Refactoring Priority \#2 to all new and existing clips.*

**6\. Why is this change necessary?**

*Spoken audio is the primary instructional channel for Grade 2 emergent readers. Unclear or incorrectly pronounced words weaken syllable recognition and vocabulary comprehension, as reflected in the 25% of children who found the voices unclear. Adult evaluators rated voiceover quality 4.0 (Agree) on Item 11, but the children who rely on the audio rated clarity lower (Q2: 75.0%), and the team's review of the recorded clips found incorrect pronunciations. Adult tolerance for the audio does not guarantee that 7-8 year olds can understand it.*

**7\. Expected improvement**

*Child voice clarity (Q2) increasing from 75.0% to ≥90.0%; Teacher Item 14 (Audio Support for Low Readers) improving from 3.0 to ≥4.5; Item 11 (Voiceover quality) improving from 4.0 to ≥4.5.*

**8\. How will the improvement eventually be measured?**

●       Child Feedback Questionnaire (Q2 Yes rate ≥90%)

●       Teacher pronunciation audit sign-off covering 100% of narration clips

●       Observer checklist ratings on Item 11 and Item 14 (≥4.5/5.0)

**9\. Priority**

●       🔴 High — Essential to achieving a SMART objective

---

# 

# 

# **Section 5 — Refactoring Summary Matrix**

| \# | Validation Finding | Evidence | SMART Objective / Outcome Affected | Proposed Refactoring | Expected Improvement | Priority |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Cognitive Friction in Instructions & Feedback: High student confusion on activity instructions and feedback cues; struggling learners clustered together. | Child Q4: 58.3% Yes; Child Q5: 66.7% Yes; 5 of 12 learners answered $\leq 4$ Yes; Teacher Item 15: 3.0 (Neutral). | Objective 1, 2, & 3: Syllable ($\geq 80%$), Vocabulary ($\geq 75%$), and Sentence ($\geq 75%$) mastery locks. Outcome: *Usability, Accuracy & Effectiveness.* | Add animated hand-cursor micro-tutorials before mechanics; implement 3-stage visual/audio error scaffolding with distractor elimination; Focus View screen mode. | Child question understanding $\geq 85%$; feedback understanding $\geq 85%$; reduction in trial-and-error guessing. | 🔴 High |
| 2 | In-Game Auditory Guidance Scaffolding: Spoken audio plays only once without replay options or visual dialogue text, limiting support for low readers. | Child Q2: 25% non-positive; Teacher Item 14 rating: 3.0 (Neutral); Observer 2 noted child had trouble listening. | Objective 1 & 2: Syllable recognition ($\geq 80%$) and Step 1/4 auditory comprehension. Outcome: *Accessibility, Usability & Effectiveness.* | Add prominent pulse-animated Audio Replay button ($\geq 56px$), synchronized speech dialogue bubbles, and backend audio volume normalization. | Child voice clarity rating $\geq 90%$; Teacher audio support rating $\geq 4.5/5.0$. | 🔴 High |
| 3 | Static Content & Lack of Graded Difficulty: Evaluators noted fixed question set and requested tiered difficulty for varied reading levels. | Observer 2 recommendation for varying difficulty; Checklist Items 8, 9,11 rated 4.0; Teacher curricular feedback. | Objective 2 & 5: Vocabulary retention ($\geq 80%$) and Teacher Klase management utility. Outcome: *Curricular Scalability & Effectiveness.* | Refactor database schema to support 3 difficulty tiers (Foundational, Standard, Challenge) with dynamic distractor selection. | Higher longitudinal engagement ($\geq 85%$); improved scaffolding for diverse learner proficiencies. | 🟠 Medium |
| 4 | Unclear and Discouraging Progress Feedback: a correct answer did not always move the progress bar. | Child Q5: 66.7% Yes; progress-bar defect recorded in Section 6. | Objectives 1–3 & 5: mastery gates and Parent Dashboard. Outcome: *Usability, Feedback Effectiveness.* | Shared answer-based HUD: monotone bar = distinct items solved ÷ total items, separate accuracy chip, and an append-only `answer_events` log for both modules and Practice Mode. | Child feedback understanding $\geq 85%$; displayed progress equals saved progress in 100% of sessions. | 🟠 Medium |
| 5 | Voice Narration Clarity and Pronunciation Accuracy: some words and instructions are mispronounced. | Child Q2: 75.0% clarity; Teacher Item 14: 3.0; Item 11: 4.0. | Objectives 1 & 2: syllable recognition and vocabulary comprehension. Outcome: *Auditory Accessibility, Usability.* | Narration audit with teacher sign-off, re-record clearer child-friendly Lolo/Lola voices, and apply the Priority \#2 peak-level normalization. *(On hold pending re-recorded audio assets.)* | Child voice clarity $\geq 90%$; Teacher Item 14 and Observer Item 11 $\geq 4.5/5.0$. | 🔴 High |

---

# **Section 6 — Items That Are NOT Refactoring Priorities**

To prevent teams from interpreting every piece of feedback as a refactoring requirement, include this section.

### **Did your validation identify any of the following?**

| Item | Identified? | Action |
| ----- | ----- | ----- |
| Bugs / errors | Yes | The progress bar intermittently failed to increase even when a child gave a correct answer. This is addressed under Refactoring Priority \#4 (answer-based progress update logic and per-answer progress saving). No other functional bugs or runtime errors occurred in the PAMANA web application during user testing. *(Note: The duplicate questionnaire response from kid02/kid03 was caused by a student submitting the external Microsoft Forms survey twice, which was addressed during survey data cleaning and is not an in-app software defect).*  |
| Minor UI/UX issues | Yes | *Improve as appropriate:* Minor button spacing adjustments, avatar portrait alignment, and smoothening card drop transitions. |
| Missing original requirement | No | All core planned MVP features (Modules 1–4, Parent Dashboard, PDF reporting) are implemented and functional. |
| Missing essential functional requirement | No | The 4-step loop and syllable blending mechanics are fully present and verified aligned with MATATAG competencies. |
| Missing non-functional requirement | Yes | *Assess and incorporate if justified:* Consistent audio volume peak normalization across all pre-recorded assets. |
| New feature unrelated to SMART objectives | Yes | *Generally do not prioritize:* Voice recognition / automated speech grading (explicitly out of scope in proposal), multiplayer PvP minigames, and 3D avatar customization. |
| Testing Environmental & Logistics Issues *(Teacher Eleanor Q2 & Q3 Feedback)* | Yes | *Operational / Protocol Improvement for Future Sessions (NOT a Software Refactoring Priority):* The teacher's comments regarding the computer lab lacking headsets and needing a "Plan B" pertained to event execution logistics rather than software requirements or system design defects. The team will provide dedicated hardware headsets during future testing deployments. |
| Improvement to measurable outcome | Yes | Potential refactoring priority: Audio replay controls, synchronized visual speech captions, and visual instruction scaffolding directly drive measurable accuracy and mastery rates. |
| Change in system approach/design | Yes | Potential refactoring priority: Migrating from static hardcoded question constants to a modular, tiered Content Bank in the database. |
| Improvement in accuracy / efficiency / effectiveness / performance  | Yes | Potential refactoring priority: Scaffolded error hints and distraction-free Focus View to eliminate guessing and accelerate task completion.  |

### **Important Question**

**If your team identified NO significant requirements or design improvements, explain why.**

> Not Applicable. The PAMANA team identified significant, evidence-backed refactoring priorities in the areas of instructional visual scaffolding, auditory replay accessibility, and tiered content architecture, all of which are directly tied to achieving the project's SMART objectives.

---

# **Section 7 — Final Team Reflection**

**1\. What is the single most important thing your team learned from the MVP validation?**

*The most critical insight our team learned is that **in educational software for early-grade Generation Alpha learners, high engagement does not automatically equal instructional comprehension**. While 91.7% of children found PAMANA fun and loved Lolo and Lola, over 41% were uncertain about what the questions asked, and 33% did not clearly understand the feedback after answering. We learned that 7–8 year old emergent readers cannot rely on text instructions or single-play audio cues; without visual demonstrations and scaffolded error explanations, children resort to guessing rather than genuine learning.*

**2\. What is the most important change your team should make based on this learning?**

*The most vital change our team must execute is **implementing interactive visual scaffolding and multi-modal guidance across all learning mechanics**. This includes: (1) animated hand-cursor micro-tutorials that visually demonstrate how to play each game before user control begins; (2) a prominent "Makinig Ulit" (Audio Replay) button paired with synchronized speech dialogue bubbles; and (3) a 3-stage scaffolded feedback loop that visually eliminates incorrect options on repeated attempts instead of showing generic error alerts.*

**3\. How will this change help your project achieve its SMART objectives more effectively?**

*This refactoring directly supports the achievement and measurement of PAMANA's SMART objectives:*

* ***Objective 1 (Syllable Mastery)**: On-demand audio replay and visual demonstrations ensure learners understand the blending mechanic, enabling genuine phonemic accuracy to reach the $\geq 80%$ progression threshold.*  
* ***Objective 2 (Vocabulary Spiraling)**: Multi-modal speech bubbles and scaffolded error hints reinforce word-meaning connections during the 4-step loop, driving true vocabulary mastery above the $\geq 75%$ target.*  
* ***Objective 4 (Dashboard & Analytics)**: Eliminating random trial-and-error clicking ensures that database records and parent at-risk indicators reflect actual reading development rather than interface confusion.*

**4\. What requirements and/or design documents will need to be updated as a result?**

*  SRS (Software Requirements Specifications):

  * Update Section 4.02 & 4.03 (Functional Requirements) to include FR-AR-01: Persistent Audio Replay Mechanic, FR-ST-02: Synchronized Speech Subtitles, and FR-ES-03: Multi-Stage Distractor Elimination Scaffolding.

  * Update Section 5.0 (Non-Functional Requirements) to add NFR for audio peak normalization ($-1dBFS$) and replay latency ($\leq 0.1s$).

*  SDD (Software Design Description):

  * Update Section 2 and 3 (Component Design) to add React UI components: \<AudioReplayButton /\>, \<DialogueSubtitles /\>, and \<InteractiveTutorialCursor /\>.

  * Update Section 4 and 5 (Database Schema) to expand QuestionEntity and VocabularyItemEntity with difficulty\_tier and distractor\_set attributes.

  * Update sequence diagrams for SyllableService and VocabularyService to illustrate the 3-attempt scaffolded feedback flow.

*  SPMP (Software Project Management Plan):

  * Revise the Midterm Sprint Backlog to schedule Refactoring Priorities 1 and 2 for immediate Sprint 4 execution.

*  Other: User Manual / Facilitation Guide (add testing hardware preparation checklist for future rounds).

---

## **Final Declaration**

> **We certify that the findings and proposed refactoring priorities submitted in this form are based on actual MVP validation feedback gathered from our identified stakeholders/users. We understand that the proposed refactoring must be justified in relation to our project's SMART objectives and measurable outcomes.**

**Team Lead:** Kyle Ed C. Maningo   
**Date:** November 23, 2026 

