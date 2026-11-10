# PAMANA - NPC Audio & Dialogue Scripts List

This document lists all NPC dialogue voiceovers, audio assets, module instructions, and dialogue templates identified in the PAMANA codebase.

---

## 1. Directory Location
- **Audio Files Directory:** `frontend/public/static/assets/audio/npc/`
- **Component Handler:** `frontend/src/components/game/NPCDialogue.tsx`

---

## 2. NPC Instruction & Prompt Voiceovers (Lolo Dialogues)

These voice lines guide the learner through each sub-level across Modules 2, 3, and 4.

| Audio File | Sub-Level / Purpose | NPC Voiceover Script (Tagalog) | Code References |
|---|---|---|---|
| `lolo_mod2_pagsama.mp3` | Module 2: Pagsama ng Tunog | *"Pakinggan at pagsamahin ang mga tunog! Alin ang resulta?"* | `SyllableModulePage.tsx`, `SyllablePracticePage.tsx` |
| `lolo_mod2_pakinggan.mp3` | Module 2: Pakinggan | *"Pakinggan nang mabuti! Alin ang pantig na narinig mo?"* | `SyllableModulePage.tsx`, `SyllablePracticePage.tsx` |
| `lolo_mod2_kilalanin.mp3` | Module 2: Kilalanin | *"Kilalanin ang pantig na nagsisimula sa salitang ito!"* | `SyllableModulePage.tsx`, `SyllablePracticePage.tsx` |
| `lolo_mod2_rhyming.mp3` | Module 2: Tumalinghaga (Rhyming) | *"Alin sa mga salitang ito ang magkatunog sa narinig?"* | `SyllableModulePage.tsx`, `SyllablePracticePage.tsx` |
| `lolo_mod3_pakinggan.mp3` | Module 3: Pakinggan | *"Pakinggan natin ang bagong salita! Pindutin ang tunog at tandaan!"* | `VocabularyModulePage.tsx` |
| `lolo_mod3_kilalanin.mp3` | Module 3: Kilalanin | *"Kilalanin! Alin ang larawan ng narinig na salita?"* | `VocabularyModulePage.tsx`, `ImagePracticePage.tsx` |
| `lolo_mod3_basahin.mp3` | Module 3: Basahin | *"Basahin! Alin ang tamang salitang nakasulat?"* | `VocabularyModulePage.tsx`, `WordPracticePage.tsx` |
| `lolo_mod3_gamitin.mp3` | Module 3: Gamitin | *"Gamitin ang salita sa pangungusap. Piliin ang tamang sagot!"* | `VocabularyModulePage.tsx` |
| `lolo_mod4_intro_tier1.mp3` | Module 4: Tier 1 Intro | *"Ayusin ang mga salita para bumuo ng pangungusap! I-drag ang mga salita sa tamang pagkakasunod."* | `SentenceModulePage.tsx`, `SentencePracticePage.tsx` |
| `lolo_mod4_intro_tier2.mp3` | Module 4: Tier 2 Intro | *"Gawing tanong ang pangungusap! Paano mo itatanong ito kay Lolo?"* | `SentenceModulePage.tsx` |

---

## 3. Module 4 Sentence Building Tasks

Sentence building audio files and the corresponding target sentences.

| Audio File | Tier / Classification | Target Sentence (Script) | Code Reference |
|---|---|---|---|
| `sentence_1.mp3` | Tier 1 (Paturol / Declarative) | *"Ako si Lolo"* | `SentenceService.java` |
| `sentence_2.mp3` | Tier 1 (Paturol / Declarative) | *"Kumain si Nanay"* | `SentenceService.java` |
| `sentence_3.mp3` | Tier 1 (Paturol / Declarative) | *"Malinis ang bahay"* | `SentenceService.java` |
| `sentence_4.mp3` | Tier 1 (Paturol / Declarative) | *"Bumasa si Ate"* | `SentenceService.java` |
| `sentence_5.mp3` | Tier 1 (Paturol / Declarative) | *"Uminom si Kuya"* | `SentenceService.java` |
| `sentence_6.mp3` | Tier 2 (Patanong / Interrogative) | *"Saan si Lola?"* | `SentenceService.java` |
| `sentence_7.mp3` | Tier 2 (Patanong / Interrogative) | *"Sino si Tatay?"* | `SentenceService.java` |
| `sentence_8.mp3` | Tier 2 (Patanong / Interrogative) | *"Nasaan ang baso?"* | `SentenceService.java` |
| `sentence_9.mp3` | Tier 2 (Patanong / Interrogative) | *"Kailan ka matutulog?"* | `SentenceService.java` |
| `sentence_10.mp3` | Tier 2 (Patanong / Interrogative) | *"Ano ang damit?"* | `SentenceService.java` |

---

## 4. Module 2 & 3 Gamitin / Hamon Dialogue Sentence Templates

Templates and audio prompts used in the sentence completion exercises.

| Audio File | Target Word | Domain | Dialogue Script / Template | Code Reference |
|---|---|---|---|---|
| `sentence_mata.mp3` | mata | `self_body` | *"Ang aking ____ ay malinaw makakita."* | `VocabularyService.java` |
| `sentence_kamay.mp3` | kamay | `self_body` | *"Gamitin ang iyong ____ para kumain."* | `VocabularyService.java` |
| `sentence_ilong.mp3` | ilong | `self_body` | *"Amuyin ang bulaklak gamit ang ____."* | `VocabularyService.java` |
| `sentence_bibig.mp3` | bibig | `self_body` | *"Ginagamit ko ang aking ____ sa pagsasalita."* | `VocabularyService.java` |
| `sentence_tenga.mp3` | tenga | `self_body` | *"Pakinggan ang ibon gamit ang ____."* | `VocabularyService.java` |
| `sentence_ulo.mp3` | ulo | `self_body` | *"Isuot ang sumbrero sa iyong ____."* | `VocabularyService.java` |
| `sentence_paa.mp3` | paa | `self_body` | *"Lumalakad ako gamit ang aking ____."* | `VocabularyService.java` |
| `sentence_likod.mp3` | likod | `self_body` | *"Tuwid dapat ang iyong ____ kapag nakaupo."* | `VocabularyService.java` |
| `sentence_tiyan.mp3` | tiyan | `self_body` | *"Busog ang aking ____ pagkatapos kumain."* | `VocabularyService.java` |
| `sentence_noo.mp3` | noo | `self_body` | *"Malamig ang tapat ng aking ____ kapag nilalagnat."* | `VocabularyService.java` |
| `sentence_nanay.mp3` | Nanay | `family_home` | *"Tinulungan ko si ____ sa paglilinis ng bahay."* | `VocabularyService.java` |
| `sentence_tatay.mp3` | Tatay | `family_home` | *"Nagluto si ____ ng masarap na ulam."* | `VocabularyService.java` |
| `sentence_lola.mp3` | Lola | `family_home` | *"Masaya si ____ kapag ako ay bumibisita."* | `VocabularyService.java` |
| `sentence_lolo.mp3` | Lolo | `family_home` | *"Nagkuwento si ____ tungkol sa lumang panahon."* | `VocabularyService.java` |
| `sentence_kuya.mp3` | Kuya | `family_home` | *"Naglalaro kami ni ____ ng bola sa labas."* | `VocabularyService.java` |
| `sentence_ate.mp3` | Ate | `family_home` | *"Tinutulungan ako ni ____ magbasa ng aklat."* | `VocabularyService.java` |
| `sentence_bahay.mp3` | bahay | `family_home` | *"Malinis at maayos ang aming ____ ngayon."* | `VocabularyService.java` |
| `sentence_kain.mp3` | kain | `family_home` | *"Tayo na sa kusina at ____ ng tanghalian."* | `VocabularyService.java` |
| `sentence_tulog.mp3` | tulog | `family_home` | *"Maaga akong magigising pagkatapos ng mahabang ____."* | `VocabularyService.java` |
| `sentence_damit.mp3` | damit | `family_home` | *"Kulay pula ang aking bagong ____ para sa reunion."* | `VocabularyService.java` |
| `sentence_sapatos.mp3` | sapatos | `family_home` | *"Isuot mo ang iyong ____ bago lumabas."* | `VocabularyService.java` |
| `sentence_silya.mp3` | silya | `family_home` | *"Umupo ka sa ____ na ito malapit kay Lola."* | `VocabularyService.java` |
| `sentence_mesa.mp3` | mesa | `family_home` | *"Ihain ang masarap na pagkain sa ibabaw ng ____."* | `VocabularyService.java` |
| `sentence_pintuan.mp3` | pintuan | `family_home` | *"Pakisara ng ____ pagpasok mo."* | `VocabularyService.java` |
| `sentence_baso.mp3` | baso | `family_home` | *"Uminom ng tubig sa malinis na ____."* | `VocabularyService.java` |
