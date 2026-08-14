"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Check, Languages, PenLine, RotateCcw, Sparkles, Star, Trophy, Type, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type Level1 = { id: number; target: string[]; hint: string };
type Level2 = { id: number; target: string[]; hint: string };
type Level3 = { id: number; parts: string[]; correct: string; options: string[]; hint: string };

interface GameData {
  mode1: Level1[];
  mode2: Level2[];
  mode3: Level3[];
}

const gameData: GameData = {
  mode1: [
    { id: 1, target: ["សា", "លា"], hint: "កន្លែងសម្រាប់សិស្សសិក្សាចំណេះដឹង" },
    { id: 2, target: ["សៀវ", "ភៅ"], hint: "វត្ថុធ្វើពីក្រដាសសម្រាប់អាន ឬសរសេរ" },
    { id: 3, target: ["កា", "បូប"], hint: "សម្រាប់ដាក់សៀវភៅ ឬសម្ភារៈផ្សេងៗ" },
    { id: 4, target: ["ខ្មៅ", "ដៃ"], hint: "ប្រដាប់សម្រាប់សរសេរ អាចលុបបាន" },
    { id: 5, target: ["ជ័រ", "លុប"], hint: "សម្រាប់លុបអក្សរដែលសរសេរខុសដោយខ្មៅដៃ" },
    { id: 6, target: ["ក្ដារ", "ខៀន"], hint: "ផ្ទាំងធំសម្រាប់គ្រូសរសេរពន្យល់" },
    { id: 7, target: ["កៅ", "អី"], hint: "សម្រាប់អង្គុយ" },
    { id: 8, target: ["ផ្ទះ", "បាយ"], hint: "កន្លែងសម្រាប់ធ្វើម្ហូប" },
    { id: 9, target: ["ដប", "ទឹក"], hint: "ប្រដាប់សម្រាប់ផ្ទុកទឹកផឹក" },
    { id: 10, target: ["មេឃ", "ភ្លៀង"], hint: "បាតុភូតធម្មជាតិធ្លាក់ទឹកពីលើអាកាស" },
    { id: 11, target: ["ខ្យល់", "បក់"], hint: "ចលនានៃខ្យល់អាកាស" },
    { id: 12, target: ["ថ្ងៃ", "រះ"], hint: "ពេលព្រលឹមព្រះអាទិត្យងើបឡើង" },
    { id: 13, target: ["សត្វ", "ឆ្កែ"], hint: "សត្វចិញ្ចឹមសម្រាប់យាមផ្ទះ" },
    { id: 14, target: ["ផ្កា", "រីក"], hint: "សភាពដែលផ្កាលាស្រទាប់របស់វា" },
    { id: 15, target: ["ដើម", "ឈើ"], hint: "រុក្ខជាតិមានដើមធំមានមែកធាង" },
    { id: 16, target: ["កុំ", "ព្យូ", "ទ័រ"], hint: "ឧបករណ៍អេឡិចត្រូនិកសម្រាប់រៀបចំទិន្នន័យ" },
    { id: 17, target: ["ទូ", "រ", "ស័ព្ទ"], hint: "ឧបករណ៍សម្រាប់ទំនាក់ទំនងគ្នាពីចម្ងាយ" },
    { id: 18, target: ["ទូ", "រ", "ទស្សន៍"], hint: "ឧបករណ៍សម្រាប់មើលរូបភាពមានចលនានិងសំឡេង" },
    { id: 19, target: ["កង្ហារ", "បញ្ចុះ", "កម្ដៅ"], hint: "ប្រដាប់បក់ខ្យល់អគ្គិសនី" },
    { id: 20, target: ["ឡាន", "ក្រុង"], hint: "យានយន្តធំសម្រាប់ដឹកអ្នកដំណើរច្រើន" },
    { id: 21, target: ["យន្ត", "ហោះ"], hint: "យានសម្រាប់ហោះហើរលើអាកាស" },
    { id: 22, target: ["ក", "ប៉ាល់"], hint: "យានសម្រាប់ធ្វើដំណើរលើទឹក" },
    { id: 23, target: ["រថ", "ភ្លើង"], hint: "យានធ្វើដំណើរលើផ្លូវដែក" },
    { id: 24, target: ["ម៉ូ", "តូ"], hint: "យានយន្តកង់ពីរ" },
    { id: 25, target: ["កង់", "បី"], hint: "យានយន្តមានកង់បី" },
    { id: 26, target: ["សុវត្ថិ", "ភាព"], hint: "ស្ថានភាពដែលគ្មានគ្រោះថ្នាក់" },
    { id: 27, target: ["អនា", "ម័យ"], hint: "ការរក្សាភាពស្អាតបាត" },
    { id: 28, target: ["សុខ", "ភាព"], hint: "ស្ថានភាពរាងកាយឬផ្លូវចិត្តល្អ" },
    { id: 29, target: ["មន្ទីរ", "ពេទ្យ"], hint: "កន្លែងព្យាបាលអ្នកជំងឺ" },
    { id: 30, target: ["សណ្ឋា", "គារ"], hint: "កន្លែងសម្រាប់ភ្ញៀវស្នាក់នៅ" },
    { id: 31, target: ["ភោជនីយ", "ដ្ឋាន"], hint: "កន្លែងលក់ម្ហូបអាហារ និងភេសជ្ជៈ" },
    { id: 32, target: ["ធនា", "គារ"], hint: "កន្លែងរក្សាប្រាក់ និងផ្ដល់ឥណទាន" },
    { id: 33, target: ["បណ្ណា", "ល័យ"], hint: "កន្លែងតម្កល់សៀវភៅសម្រាប់អាន" },
    { id: 34, target: ["ទី", "ផ្សារ"], hint: "កន្លែងទិញលក់ទំនិញ" },
    { id: 35, target: ["គ្រូ", "បង្រៀន"], hint: "អ្នកផ្ដល់ចំណេះដឹងដល់សិស្ស" },
    { id: 36, target: ["ប្រវត្តិ", "សាស្ត្រ"], hint: "ការសិក្សាពីព្រឹត្តិការណ៍អតីតកាល" },
    { id: 37, target: ["វប្ប", "ធម៌"], hint: "ការបណ្ដុះបណ្ដាលស្មារតីនិងប្រាជ្ញា" },
    { id: 38, target: ["អរិយ", "ធម៌"], hint: "ការរីកចម្រើនខ្ពង់ខ្ពស់របស់សង្គមជាតិ" },
    { id: 39, target: ["សេដ្ឋ", "កិច្ច"], hint: "ការគ្រប់គ្រងធនធាននិងហិរញ្ញវត្ថុ" },
    { id: 40, target: ["នយោ", "បាយ"], hint: "កិច្ចការទាក់ទងនឹងការដឹកនាំរដ្ឋ" },
    { id: 41, target: ["សង្គម", "ជាតិ"], hint: "បណ្ដុំនៃប្រជាជនក្នុងប្រទេសមួយ" },
    { id: 42, target: ["ទេស", "ចរណ៍"], hint: "ការធ្វើដំណើរកម្សាន្ត" },
    { id: 43, target: ["កសិ", "កម្ម"], hint: "ការដាំដុះនិងចិញ្ចឹមសត្វ" },
    { id: 44, target: ["ឧស្សាហ", "កម្ម"], hint: "សកម្មភាពផលិតទំនិញជាលក្ខណៈទ្រង់ទ្រាយធំ" },
    { id: 45, target: ["បច្ចេក", "វិទ្យា"], hint: "ចំណេះដឹងខាងបង្កើតឧបករណ៍ប្រើប្រាស់ទំនើប" },
    { id: 46, target: ["ទំនាក់", "ទំនង"], hint: "ការទាក់ទងគ្នាពីមនុស្សម្នាក់ទៅម្នាក់" },
    { id: 47, target: ["ប្រជា", "ធិបតេយ្យ"], hint: "របបដឹកនាំដែលអំណាចជារបស់ប្រជាជន" },
    { id: 48, target: ["រដ្ឋា", "ភិបាល"], hint: "គណៈរដ្ឋមន្ត្រីដែលដឹកនាំប្រទេស" },
    { id: 49, target: ["ព្រះ", "រាជា", "ណា", "ចក្រ"], hint: "ប្រទេសដែលមានព្រះមហាក្សត្រគ្រប់គ្រង" },
    { id: 50, target: ["សា", "កល", "វិទ្យា", "ល័យ"], hint: "គ្រឹះស្ថានឧត្តមសិក្សា" },
  ],
  mode2: [
    { id: 1, target: ["ខ្ញុំ", "ទៅ", "សាលារៀន", "។"], hint: "សកម្មភាពប្រចាំថ្ងៃរបស់សិស្ស" },
    { id: 2, target: ["គាត់", "ញ៉ាំ", "បាយ", "។"], hint: "សកម្មភាពពេលឃ្លាន" },
    { id: 3, target: ["ម៉ាក់", "ទិញ", "ម្ហូប", "។"], hint: "ការងារផ្ទះ" },
    { id: 4, target: ["ប៉ា", "ទៅ", "ធ្វើការ", "។"], hint: "ការប្រកបមុខរបរ" },
    { id: 5, target: ["សត្វឆ្កែ", "ព្រុស", "ខ្លាំង", "ណាស់", "។"], hint: "សំឡេងសត្វ" },
    { id: 6, target: ["មេឃ", "កំពុង", "ភ្លៀង", "។"], hint: "អាកាសធាតុ" },
    { id: 7, target: ["ខ្យល់", "បក់", "ត្រជាក់", "។"], hint: "អាកាសធាតុ" },
    { id: 8, target: ["សត្វស្លាប", "ហើរ", "លើ", "មេឃ", "។"], hint: "ចលនារបស់សត្វ" },
    { id: 9, target: ["ត្រី", "ហែល", "ក្នុង", "ទឹក", "។"], hint: "សត្វក្នុងទឹក" },
    { id: 10, target: ["ផ្កា", "រីក", "ស្អាត", "ណាស់", "។"], hint: "ភាពស្រស់ស្អាតនៃរុក្ខជាតិ" },
    { id: 11, target: ["បងប្រុស", "អាន", "សៀវភៅ", "។"], hint: "ការសិក្សាស្វែងយល់" },
    { id: 12, target: ["ប្អូនស្រី", "ច្រៀង", "ចម្រៀង", "។"], hint: "ការកម្សាន្តសប្បាយ" },
    { id: 13, target: ["គ្រូ", "សរសេរ", "លើក្ដារខៀន", "។"], hint: "សកម្មភាពក្នុងថ្នាក់រៀន" },
    { id: 14, target: ["សិស្ស", "ស្ដាប់", "គ្រូពន្យល់", "។"], hint: "ការយកចិត្តទុកដាក់រៀន" },
    { id: 15, target: ["ខ្ញុំ", "ស្រលាញ់", "គ្រួសារខ្ញុំ", "។"], hint: "មនោសញ្ចេតនា" },
    { id: 16, target: ["ខ្ញុំ", "ចូលចិត្ត", "អាន", "សៀវភៅ", "រឿង", "។"], hint: "ចំណង់ចំណូលចិត្ត" },
    { id: 17, target: ["គាត់", "លេង", "បាល់ទាត់", "ជាមួយ", "មិត្តភក្តិ", "។"], hint: "ការលេងកីឡា" },
    { id: 18, target: ["គ្រូបង្រៀន", "ពន្យល់", "មេរៀន", "យ៉ាង", "ក្បោះក្បាយ", "។"], hint: "ការបង្រៀន" },
    { id: 19, target: ["យើង", "ត្រូវ", "ថែរក្សា", "បរិស្ថាន", "ទាំងអស់គ្នា", "។"], hint: "ការចូលរួមថែរក្សាភពផែនដី" },
    { id: 20, target: ["ខ្មែរ", "មាន", "វប្បធម៌", "ចំណាស់", "យូរលង់", "។"], hint: "មោទនភាពជាតិ" },
    { id: 21, target: ["យុវជន", "គឺជា", "ទំពាំង", "ស្នង", "ឫស្សី", "។"], hint: "សុភាសិតអប់រំយុវជន" },
    { id: 22, target: ["កសិករ", "ធ្វើស្រែ", "ចម្ការ", "ចិញ្ចឹម", "ជីវិត", "។"], hint: "មុខរបរប្រជាជនខ្មែរភាគច្រើន" },
    { id: 23, target: ["សុខភាព", "គឺជា", "ទ្រព្យសម្បត្តិ", "ដ៏មាន", "តម្លៃ", "។"], hint: "សារៈសំខាន់នៃការថែរក្សាសុខភាព" },
    { id: 24, target: ["ការអប់រំ", "គឺជា", "គន្លឹះ", "នៃ", "ភាពជោគជ័យ", "។"], hint: "តម្លៃនៃការសិក្សា" },
    { id: 25, target: ["សូម", "គោរព", "ច្បាប់", "ចរាចរណ៍", "ជានិច្ច", "។"], hint: "ការធ្វើដំណើរដោយសុវត្ថិភាព" },
    { id: 26, target: ["ប្រាសាទ", "អង្គរវត្ត", "ល្បីល្បាញ", "ពេញ", "ពិភពលោក", "។"], hint: "អច្ឆរិយវត្ថុរបស់ខ្មែរ" },
    { id: 27, target: ["ការអាន", "សៀវភៅ", "ជួយ", "បង្កើន", "ចំណេះដឹង", "។"], hint: "ប្រយោជន៍នៃការអាន" },
    { id: 28, target: ["ទឹក", "ស្អាត", "នាំមក", "នូវ", "សុខភាពល្អ", "។"], hint: "ការរស់នៅស្អាត" },
    { id: 29, target: ["សាមគ្គីភាព", "នាំមក", "នូវ", "ភាព", "រឹងមាំ", "។"], hint: "ការរួបរួមគ្នា" },
    { id: 30, target: ["ពេលវេលា", "មានតម្លៃ", "ជាង", "មាស", "ប្រាក់", "។"], hint: "ការប្រើប្រាស់ពេលឲ្យមានប្រយោជន៍" },
    { id: 31, target: ["កុំ", "ទុក", "ថ្ងៃស្អែក", "អ្វីដែល", "អាចធ្វើបានថ្ងៃនេះ", "។"], hint: "ការមិនរុញរាការងារ" },
    { id: 32, target: ["យើង", "គួរ", "ញ៉ាំ", "បន្លែ", "និងផ្លែឈើ", "។"], hint: "ការបរិភោគអាហារមានជីវជាតិ" },
    { id: 33, target: ["កីឡា", "នាំមក", "នូវ", "សុខភាព", "រឹងមាំ", "។"], hint: "អត្ថប្រយោជន៍នៃការហាត់ប្រាណ" },
    { id: 34, target: ["សត្វព្រៃ", "ជាច្រើន", "រស់នៅ", "ក្នុង", "ព្រៃធំ", "។"], hint: "ជម្រកសត្វ" },
    { id: 35, target: ["រដូវវស្សា", "មាន", "ភ្លៀងធ្លាក់", "យ៉ាង", "ជោកជាំ", "។"], hint: "រដូវកាលនៅប្រទេសកម្ពុជា" },
    { id: 36, target: ["ចំណេះវិជ្ជា", "ជា", "ទ្រព្យ", "ជាប់ប្រាណ", "ចោរលួចមិនបាន", "។"], hint: "សុភាសិតអំពីការសិក្សា" },
    { id: 37, target: ["វប្បធម៌", "រលត់", "ជាតិរលាយ", "វប្បធម៌", "ពណ្ណរាយ", "ជាតិថ្កើងថ្កាន", "។"], hint: "សុភាសិតអំពីតម្លៃវប្បធម៌" },
    { id: 38, target: ["ប្រទេស", "កម្ពុជា", "ពោរពេញ", "ទៅដោយ", "ធនធាន", "ធម្មជាតិ", "។"], hint: "សក្តានុពលប្រទេស" },
    { id: 39, target: ["បច្ចេកវិទ្យា", "ព័ត៌មានវិទ្យា", "កំពុង", "ដើរតួនាទី", "យ៉ាងសំខាន់", "ក្នុងសង្គម", "។"], hint: "ការវិវត្តនៃសម័យកាល" },
    { id: 40, target: ["សន្តិភាព", "គឺជា", "មូលដ្ឋានគ្រឹះ", "នៃ", "ការអភិវឌ្ឍ", "ប្រទេសជាតិ", "។"], hint: "តម្លៃនៃសន្តិភាព" },
    { id: 41, target: ["ការប្រែប្រួល", "អាកាសធាតុ", "គឺជា", "បញ្ហា", "ប្រឈម", "សកល", "។"], hint: "បញ្ហាបរិស្ថាន" },
    { id: 42, target: ["វិស័យ", "ទេសចរណ៍", "ជួយ", "ជំរុញ", "កំណើន", "សេដ្ឋកិច្ចជាតិ", "។"], hint: "ការរកចំណូលជាតិ" },
    { id: 43, target: ["ការគោរព", "សិទ្ធិមនុស្ស", "ជា", "កាតព្វកិច្ច", "របស់", "យើងគ្រប់គ្នា", "។"], hint: "គោលការណ៍សង្គម" },
    { id: 44, target: ["ភាសាខ្មែរ", "មាន", "វាក្យសព្ទ", "ដ៏", "សម្បូរបែប", "និង", "ជ្រាលជ្រៅ", "។"], hint: "លក្ខណៈពិសេសនៃភាសាជាតិ" },
    { id: 45, target: ["ព្រៃឈើ", "គឺជា", "សួត", "របស់", "ភពផែនដី", "យើង", "។"], hint: "សារៈសំខាន់នៃបរិស្ថាន" },
    { id: 46, target: ["ការបណ្ដុះបណ្ដាល", "ធនធានមនុស្ស", "ជា", "អាទិភាព", "ចម្បង", "របស់", "រដ្ឋាភិបាល", "។"], hint: "គោលនយោបាយអភិវឌ្ឍន៍" },
    { id: 47, target: ["យើង", "ត្រូវ", "ចេះ", "ជួយយកអាសា", "គ្នា", "ក្នុងគ្រា", "មានអាសន្ន", "។"], hint: "ការចែករំលែកសេចក្តីល្អ" },
    { id: 48, target: ["អក្ខរកម្ម", "ឌីជីថល", "មាន", "សារៈសំខាន់", "ណាស់", "នាសម័យ", "បច្ចុប្បន្ន", "។"], hint: "ចំណេះដឹងទាក់ទងនឹងបច្ចេកវិទ្យា" },
    { id: 49, target: ["មហាសមុទ្រ", "គឺជា", "ប្រភព", "ជីវិត", "ដ៏ធំធេង", "លើ", "ផែនដី", "។"], hint: "ប្រព័ន្ធអេកូឡូស៊ី" },
    { id: 50, target: ["ការអភិរក្ស", "ប្រាសាទបុរាណ", "គឺជា", "ភារកិច្ច", "របស់", "កូនខ្មែរ", "គ្រប់រូប", "។"], hint: "កាតព្វកិច្ចថែរក្សាកេរដំណែល" },
  ],
  mode3: [
    { id: 1, parts: ["អា", ""], correct: "ហារ", options: ["ហារ", "ហៀរ", "ហូរ", "ហាន"], hint: "របស់បរិភោគ" },
    { id: 2, parts: ["សប្បាយ", ""], correct: "ចិត្ត", options: ["កាយ", "ចិត្ត", "លេង", "ណាស់"], hint: "អារម្មណ៍រីករាយ" },
    { id: 3, parts: ["គ្រួ", ""], correct: "សារ", options: ["សារ", "ស៊ាន", "សិល្ប៍", "សព្ទ"], hint: "ក្រុមមនុស្សរស់នៅក្រោមដំបូលតែមួយ" },
    { id: 4, parts: ["ធម្ម", ""], correct: "ជាតិ", options: ["ជាតិ", "ធម៌", "ជន", "ន័យ"], hint: "អ្វីៗដែលកើតមានឡើងឯងៗលើផែនដី" },
    { id: 5, parts: ["សុខ", ""], correct: "ភាព", options: ["ភាព", "សាន្ត", "មាល", "ដុម"], hint: "ភាពដែលមិនមានជំងឺ" },
    { id: 6, parts: ["", "ខៀន"], correct: "ក្ដារ", options: ["តុ", "ក្ដារ", "កៅ", "សៀវ"], hint: "សម្រាប់គ្រូសរសេរ" },
    { id: 7, parts: ["សៀវ", ""], correct: "ភៅ", options: ["ភៅ", "រៀន", "សរសេរ", "អាន"], hint: "សម្រាប់អាន" },
    { id: 8, parts: ["កា", ""], correct: "បូប", options: ["តាប", "បូប", "រ៉ុង", "បាស"], hint: "សម្រាប់ស្ពាយ" },
    { id: 9, parts: ["", "ទាត់"], correct: "បាល់", options: ["ទាត់", "បាល់", "លេង", "រត់"], hint: "កីឡាពេញនិយម" },
    { id: 10, parts: ["មន្ទីរ", ""], correct: "ពេទ្យ", options: ["រៀន", "ពេទ្យ", "ឃុំ", "ការ"], hint: "កន្លែងព្យាបាលជំងឺ" },
    { id: 11, parts: ["", "ម៉ៃ"], correct: "ស្រ", options: ["ស្រ", "ស", "ស៊", "ស្មា"], hint: "ការគិតរូបារម្មណ៍" },
    { id: 12, parts: ["មិត្ត", ""], correct: "ភក្តិ", options: ["ភាព", "ភក្តិ", "សម្លាញ់", "ស្និទ្ធ"], hint: "អ្នករាប់អានគ្នា" },
    { id: 13, parts: ["", "ល័យ"], correct: "វិទ្យា", options: ["សាលា", "វិទ្យា", "បណ្ណា", "មន្ទីរ"], hint: "កន្លែងរៀនសូត្រកម្រិតមធ្យម" },
    { id: 14, parts: ["អាកាស", ""], correct: "ធាតុ", options: ["ធាតុ", "កាស", "យាន", "ដ្ឋាន"], hint: "ស្ថានភាពនៃបរិយាកាស" },
    { id: 15, parts: ["ទេស", ""], correct: "ភាព", options: ["ភាព", "ចរណ៍", "រដ្ឋ", "កាល"], hint: "ទិដ្ឋភាពទូទៅ" },
    { id: 16, parts: ["កសិ", ""], correct: "កម្ម", options: ["ករ", "កម្ម", "កាន", "កិប"], hint: "ការដាំដុះ និងចិញ្ចឹមសត្វ" },
    { id: 17, parts: ["សន្តិ", ""], correct: "ភាព", options: ["ភាព", "សាន", "ជន", "បាល"], hint: "ស្ថានភាពដែលគ្មានសង្គ្រាម" },
    { id: 18, parts: ["", "វឌ្ឍន៍"], correct: "អភិ", options: ["វិ", "អភិ", "បរិ", "សហ"], hint: "ការធ្វើឱ្យមានការរីកចម្រើន" },
    { id: 19, parts: ["", "គមន៍"], correct: "ស្វា", options: ["ជា", "ស្វា", "ទោ", "សុំ"], hint: "ការទទួលរាក់ទាក់អ្នកមកដល់" },
    { id: 20, parts: ["វិទ្យា", ""], correct: "សាស្រ្ត", options: ["ល័យ", "សាស្រ្ត", "ស្ថាន", "ទាន"], hint: "ចំណេះដឹងបានមកពីការសង្កេត និងពិសោធន៍" },
    { id: 21, parts: ["សេដ្ឋ", ""], correct: "កិច្ច", options: ["កិច្ច", "ជន", "ការ", "ភាព"], hint: "ការគ្រប់គ្រងធនធាន" },
    { id: 22, parts: ["ប្រវត្តិ", ""], correct: "សាស្ត្រ", options: ["សាស្ត្រ", "ការ", "កាល", "រូប"], hint: "ការសិក្សាពីអតីតកាល" },
    { id: 23, parts: ["", "សាស្ត្រ"], correct: "ភូមិ", options: ["ភូមិ", "ប្រទេស", "ដី", "ផែន"], hint: "ការសិក្សាពីផែនដី" },
    { id: 24, parts: ["បច្ចេក", ""], correct: "វិទ្យា", options: ["ទេស", "វិទ្យា", "កម្ម", "ភាព"], hint: "ការប្រើប្រាស់ចំណេះដឹងវិទ្យាសាស្ត្រ" },
    { id: 25, parts: ["", "សព្ទ"], correct: "វាក្យ", options: ["ពាក្យ", "វាក្យ", "ទូរ", "ទស្សន"], hint: "បណ្តុំនៃពាក្យ" },
    { id: 26, parts: ["អរិយ", ""], correct: "ធម៌", options: ["ធម៌", "សង្ឃ", "ជន", "ក្សត្រ"], hint: "ការរីកចម្រើនខ្ពង់ខ្ពស់" },
    { id: 27, parts: ["វប្ប", ""], correct: "ធម៌", options: ["ធម៌", "កម្ម", "ជន", "ស្ថាន"], hint: "របៀបរបបរស់នៅ និងប្រពៃណី" },
    { id: 28, parts: ["ពាណិជ្ជ", ""], correct: "កម្ម", options: ["កម្ម", "ករ", "ការ", "កិច្ច"], hint: "ការជួញដូរ" },
    { id: 29, parts: ["", "តេយ្យ"], correct: "ប្រជាធិប", options: ["រាជាធិប", "ប្រជាធិប", "អភិបាល", "សង្គម"], hint: "របបដឹកនាំដោយប្រជាជន" },
    { id: 30, parts: ["រដ្ឋា", ""], correct: "ភិបាល", options: ["ភិបាល", "សភា", "ធម្មនុញ្ញ", "មន្ត្រី"], hint: "ស្ថាប័ននីតិប្រតិបត្តិ" },
    { id: 31, parts: ["ទស្សន", ""], correct: "វិជ្ជា", options: ["វិជ្ជា", "ទាន", "កិច្ច", "កាម"], hint: "ការសិក្សាពីបញ្ហាជាមូលដ្ឋាន" },
    { id: 32, parts: ["អគ្គិ", ""], correct: "សនី", options: ["សនី", "ភ័យ", "ទេវតា", "កុសល"], hint: "ថាមពលភ្លើង" },
    { id: 33, parts: ["សីល", ""], correct: "ធម៌", options: ["ធម៌", "ទាន", "វ័ន្ត", "សមាធិ"], hint: "ការប្រព្រឹត្តល្អ" },
    { id: 34, parts: ["ឧស្សាហ", ""], correct: "កម្ម", options: ["កម្ម", "ករ", "នាម", "កិច្ច"], hint: "ការផលិតទ្រង់ទ្រាយធំ" },
    { id: 35, parts: ["", "នុញ្ញ"], correct: "រដ្ឋធម្ម", options: ["រដ្ឋធម្ម", "ច្បាប់", "ព្រះធម្ម", "អនុ"], hint: "ច្បាប់កំពូលរបស់ប្រទេស" },
    { id: 36, parts: ["ព្រះរាជា", "", "ចក្រ"], correct: "ណា", options: ["ណា", "នុ", "មហា", "នគរ"], hint: "នាមប្រទេស" },
    { id: 37, parts: ["ធនធាន", "", "ជាតិ"], correct: "ធម្ម", options: ["ធម្ម", "មនុស្ស", "សង្គម", "រដ្ឋ"], hint: "អ្វីៗដែលមានស្រាប់ក្នុងធម្មជាតិ" },
    { id: 38, parts: ["ហេដ្ឋា", "", "សម្ព័ន្ធ"], correct: "រចនា", options: ["រចនា", "កសាង", "រដ្ឋា", "ស្ថាបនា"], hint: "ផ្លូវ ស្ពាន អគារ ជាដើម" },
    { id: 39, parts: ["ប្រតិ", "", "ការ"], correct: "បត្តិ", options: ["បត្តិ", "កម្ម", "សន្ធិ", "កូដ"], hint: "ការអនុវត្តការងារ" },
    { id: 40, parts: ["សហ", ""], correct: "គ្រាស", options: ["គ្រាស", "ការ", "គមន៍", "ព័ន្ធ"], hint: "អាជីវកម្ម ក្រុមហ៊ុន" },
    { id: 41, parts: ["", "សង្គ្រោះ"], correct: "សង្គម", options: ["សង្គម", "មនុស្ស", "កិច្ច", "ជាតិ"], hint: "កិច្ចការជួយសង្គម" },
    { id: 42, parts: ["ទូរគមនា", ""], correct: "គមន៍", options: ["គមន៍", "ការ", "កិច្ច", "សព្ទ"], hint: "ការទាក់ទងគ្នាពីចម្ងាយ" },
    { id: 43, parts: ["បដិ", ""], correct: "សណ្ឋារៈ", options: ["សណ្ឋារៈ", "វត្តន៍", "កូដ", "សន្ធិ"], hint: "ការទទួលរាក់ទាក់ភៀវ" },
    { id: 44, parts: ["", "ធិកា"], correct: "អគ្គលេខា", options: ["អគ្គលេខា", "គណៈកម្ម", "នាយក", "ប្រធាន"], hint: "អ្នកដឹកនាំលេខាធិការដ្ឋាន" },
    { id: 45, parts: ["សុខា", "", "បាល"], correct: "ភិ", options: ["ភិ", "នុ", "ធិ", "សិ"], hint: "ទាក់ទងនឹងសុខភាពសាធារណៈ" },
    { id: 46, parts: ["អន្តរ", ""], correct: "ជាតិ", options: ["ជាតិ", "គមន៍", "កាល", "រដ្ឋ"], hint: "ទាក់ទងនឹងប្រទេសច្រើន" },
    { id: 47, parts: ["", "យន្ត"], correct: "ស្វ័យ", options: ["ស្វ័យ", "យន្ត", "គ្រឿង", "រថ"], hint: "អ្វីដែលដំណើរការដោយខ្លួនឯង" },
    { id: 48, parts: ["គរុ", ""], correct: "កោសល្យ", options: ["កោសល្យ", "វិជ្ជា", "និស្សិត", "បណ្ឌិត"], hint: "វិធីសាស្ត្របង្រៀន" },
    { id: 49, parts: ["មនោ", "ធម៌"], correct: "សញ្ចេតនា", options: ["សញ្ចេតនា", "គមន៍", "រម្យ", "វិជ្ជា"], hint: "ក្ដីស្រលាញ់ ការអាណិត" },
    { id: 50, parts: ["អច្ឆរិយ", ""], correct: "វត្ថុ", options: ["វត្ថុ", "ជន", "ភាព", "ឋាន"], hint: "របស់ដែលអស្ចារ្យ" },
  ],
};

type ModeId = 1 | 2 | 3;
type Screen = "menu" | "game" | "result";

interface ProgressState {
  mode1: number;
  mode2: number;
  mode3: number;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const MODE_TITLES: Record<ModeId, { title: string; khmer: string }> = {
  1: { title: "Arrange syllables into words", khmer: "រៀបព្យាង្គជាពាក្យ" },
  2: { title: "Arrange words into sentences", khmer: "រៀបពាក្យជាល្បះ" },
  3: { title: "Fill the missing syllable", khmer: "បំពេញព្យាង្គដែលបាត់" },
};

export default function KhmerWordGame() {
  const { text: t } = useLanguage();
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<ModeId | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useToolState("kwg:score", 0);
  const [progress, setProgress] = useToolState<ProgressState>("kwg:progress", { mode1: 0, mode2: 0, mode3: 0 });
  const [soundOn, setSoundOn] = useToolState("kwg:sound", true);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [source, setSource] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<number | null>(null);
  const [overSource, setOverSource] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "correct" | "wrong"; text: string } | null>(null);
  const [pulse, setPulse] = useState<"correct" | "wrong" | null>(null);
  const [confetti, setConfetti] = useState<number[]>([]);

  const audioRef = useRef<AudioContext | null>(null);

  function getData(): Level1[] | Level2[] | Level3[] {
    return mode ? gameData[`mode${mode}`] : [];
  }

  function playSound(kind: "click" | "correct" | "wrong" | "win") {
    if (!soundOn) return;
    try {
      const ctx = audioRef.current ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (kind === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
      } else if (kind === "correct") {
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = freq;
          g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.35);
          o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.35);
        });
      } else if (kind === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
      } else if (kind === "win") {
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = freq;
          g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
          g.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.1 + 0.05);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.4);
          o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.4);
        });
      }
    } catch { /* audio blocked */ }
  }

  function startGame(nextMode: ModeId, resumeLevel?: number) {
    setMode(nextMode);
    setLevelIndex(resumeLevel ?? progress[`mode${nextMode}`] ?? 0);
    setScreen("game");
    playSound("click");
    loadLevel(nextMode, resumeLevel ?? progress[`mode${nextMode}`] ?? 0);
  }

  function fireConfetti() {
    setConfetti(Array.from({ length: 80 }, (_, i) => i));
    window.setTimeout(() => setConfetti([]), 4000);
  }

  function loadLevel(nextMode: ModeId, index: number) {
    const data = gameData[`mode${nextMode}`];
    if (index >= data.length) {
      setScreen("result");
      playSound("win");
      fireConfetti();
      return;
    }
    const puzzle = data[index];
    if (nextMode === 3) {
      const p3 = puzzle as Level3;
      setSlots([null]);
      setSource(shuffle(p3.options));
    } else {
      const p12 = puzzle as Level1;
      setSlots(new Array<string | null>(p12.target.length).fill(null));
      setSource(shuffle(p12.target));
    }
    setSelected(null);
    setDragging(null);
    setOverSlot(null);
    setOverSource(false);
    setFeedback(null);
    setPulse(null);
  }

  function placeAtSlot(text: string, slotIdx: number) {
    setSlots((prev) => {
      const next = [...prev];
      const displaced = next[slotIdx];
      if (displaced) setSource((s) => shuffle([...s, displaced]));
      next[slotIdx] = text;
      return next;
    });
    setSource((s) => s.filter((p) => p !== text));
    setSelected(null);
    playSound("click");
  }

  function moveToSource(slotIdx: number) {
    setSlots((prev) => {
      const next = [...prev];
      const value = next[slotIdx];
      if (value) setSource((s) => shuffle([...s, value]));
      next[slotIdx] = null;
      return next;
    });
    setSelected(null);
  }

  function onDragStart(text: string, e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", text);
    setDragging(text);
    setSelected(null);
  }

  function onDragEnd() {
    setDragging(null);
    setOverSlot(null);
    setOverSource(false);
  }

  function onSlotDragOver(e: React.DragEvent, slotIdx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverSlot(slotIdx);
  }

  function onSlotDrop(e: React.DragEvent, slotIdx: number) {
    e.preventDefault();
    e.stopPropagation();
    const text = e.dataTransfer.getData("text/plain") || dragging;
    setOverSlot(null);
    if (text) {
      placeAtSlot(text, slotIdx);
      setDragging(null);
    }
  }

  function onSourceDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverSource(true);
  }

  function onSourceDrop(e: React.DragEvent) {
    e.preventDefault();
    setOverSource(false);
    const text = e.dataTransfer.getData("text/plain") || dragging;
    setDragging(null);
    if (!text) return;
    // Move the piece out of whichever slot holds it.
    setSlots((prev) => {
      const next = [...prev];
      const idx = next.indexOf(text);
      if (idx >= 0) {
        next[idx] = null;
        setSource((s) => shuffle([...s, text]));
      }
      return next;
    });
  }

  function checkAnswer() {
    if (!mode) return;
    const filled = slots.filter((s) => s !== null).length === slots.length;
    if (!filled) {
      setFeedback({ type: "wrong", text: t("Please fill all the slots first!", "សូមបំពេញចន្លោះទាំងអស់សិន!") });
      return;
    }
    const data = getData();
    const puzzle = data[levelIndex];
    let correct = false;
    if (mode === 3) {
      correct = slots[0] === (puzzle as Level3).correct;
    } else {
      correct = slots.every((value, i) => value === (puzzle as Level1).target[i]);
    }
    if (correct) {
      playSound("correct");
      setFeedback({ type: "correct", text: t("Correct! Amazing!", "ត្រឹមត្រូវ! អស្ចារ្យណាស់!") });
      setPulse("correct");
      const gained = 10;
      setScore((s) => s + gained);
      window.setTimeout(() => {
        setPulse(null);
        const next = levelIndex + 1;
        setLevelIndex(next);
        if (mode) setProgress((p) => ({ ...p, [`mode${mode}`]: next }));
        if (next >= data.length) {
          setScreen("result");
          playSound("win");
          fireConfetti();
        } else if (mode) {
          loadLevel(mode, next);
        }
      }, 1500);
    } else {
      playSound("wrong");
      setFeedback({ type: "wrong", text: t("Not quite right, try again!", "មិនទាន់ត្រឹមត្រូវទេ សាកល្បងម្ដងទៀត!") });
      setPulse("wrong");
      window.setTimeout(() => setPulse(null), 600);
    }
  }

  function goMenu() {
    setMode(null);
    setScreen("menu");
    playSound("click");
  }

  function resetLevel() {
    if (!mode) return;
    loadLevel(mode, levelIndex);
    playSound("click");
  }

  function continuePlaying() {
    if (!mode) return;
    const data = getData();
    const resumeLevel = progress[`mode${mode}`] ?? 0;
    if (resumeLevel >= data.length) {
      setScreen("menu");
    } else {
      setLevelIndex(resumeLevel);
      setScreen("game");
      loadLevel(mode, resumeLevel);
    }
    playSound("click");
  }

  function resetAllScores() {
    setScore(0);
    setProgress({ mode1: 0, mode2: 0, mode3: 0 });
  }

  const puzzle = mode ? getData()[Math.min(levelIndex, getData().length - 1)] : null;
  const progressPercent = mode ? Math.round(((progress[`mode${mode}`] ?? 0) / getData().length) * 100) : 0;

  const modes = [
    { id: 1 as ModeId, icon: Languages, color: "#3b82f6", title: t("Syllables → Words", "រៀបព្យាង្គជាពាក្យ"), desc: t("Assemble scattered syllables into the correct word", "ផ្គុំព្យាង្គដែលរាយប៉ាយឲ្យទៅជាពាក្យត្រឹមត្រូវ"), done: (progress.mode1 ?? 0) >= gameData.mode1.length },
    { id: 2 as ModeId, icon: Type, color: "#22c55e", title: t("Words → Sentences", "រៀបពាក្យជាល្បះ"), desc: t("Order the words into a complete, meaningful sentence", "តម្រៀបពាក្យឲ្យទៅជាប្រយោគមានន័យពេញលេញ"), done: (progress.mode2 ?? 0) >= gameData.mode2.length },
    { id: 3 as ModeId, icon: PenLine, color: "#a855f7", title: t("Fill Missing Syllable", "បំពេញព្យាង្គដែលបាត់"), desc: t("Find the correct syllable to complete the word", "ស្វែងរកព្យាង្គត្រឹមត្រូវដើម្បីបំពេញចន្លោះក្នុងពាក្យ"), done: (progress.mode3 ?? 0) >= gameData.mode3.length },
  ];

  const actionBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]";

  return (
    <ToolShell
      title="Khmer Word Arrange Game"
      khmerTitle="ហ្គេម រៀបពាក្យខ្មែរ"
      description="A fun Khmer language game with three modes: arrange syllables into words, order words into sentences, and fill missing syllables. Your score and level progress are saved so you can continue playing anytime."
      descriptionKm="ហ្គេមភាសាខ្មែរកម្សាន្តមានបីរបៀប៖ រៀបព្យាង្គឲ្យជាពាក្យ តម្រៀបពាក្យឲ្យជាប្រយោគ និងបំពេញព្យាង្គដែលបាត់។ ពិន្ទុ និងវឌ្ឍនភាពរបស់អ្នកត្រូវបានរក្សាទុក ដើម្បីអាចលេងបន្តបានគ្រប់ពេល។"
    >
      {/* Header bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-1.5 font-bold text-[var(--gold)]">
          <Star size={16} /> {score}
        </div>
        <button type="button" className={actionBtn} onClick={() => setSoundOn((v) => !v)} title={t("Toggle sound", "បើក/បិទសំឡេង")}>
          {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>

      {screen === "menu" && (
        <div className="space-y-6">
          <h2 className="text-center font-display text-xl font-semibold text-[var(--ink)]">{t("Choose a game mode", "សូមជ្រើសរើសរបៀបលេង")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {modes.map((m) => {
              const Icon = m.icon;
              const resume = progress[`mode${m.id}`] ?? 0;
              return (
                <button key={m.id} type="button" onClick={() => startGame(m.id)} className="group flex flex-col items-center gap-3 rounded-2xl border-4 border-transparent bg-[var(--ground-raised)] p-6 text-center transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: `${m.color}66` }}>
                  <span className="flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ backgroundColor: `${m.color}22`, color: m.color }}>
                    <Icon size={30} />
                  </span>
                  <h3 className="font-bold" style={{ color: m.color }}>{m.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--ink-dim)]">{m.desc}</p>
                  <span className={`mt-1 text-[11px] font-semibold ${m.done ? "text-[var(--success)]" : "text-[var(--ink-faint)]"}`}>
                    {m.done ? t("Completed!", "បានបញ្ចប់!") : `${resume}/${gameData[`mode${m.id}`].length} ${t("levels", "កម្រិត")}`}
                  </span>
                </button>
              );
            })}
          </div>
          {score > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className={actionBtn} onClick={resetAllScores}>
                <RotateCcw size={13} /> {t("Reset all scores", "កំណត់ពិន្ទុឡើងវិញ")}
              </button>
            </div>
          )}
        </div>
      )}

      {screen === "game" && mode && puzzle && (
        <div className="space-y-5">
          {/* Game header */}
          <div className="flex items-center justify-between gap-3">
            <button type="button" className={actionBtn} onClick={goMenu}><ArrowLeft size={15} />{t("Back", "ត្រឡប់")}</button>
            <h2 className="text-center text-lg font-bold text-[var(--ink)]">{t(MODE_TITLES[mode].title, MODE_TITLES[mode].khmer)}</h2>
            <span className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 font-mono-ui text-xs font-bold text-[var(--ink-dim)]">{levelIndex + 1}/{getData().length}</span>
          </div>

          {/* Progress */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
            <div className="h-full bg-[var(--success)] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Question */}
          <div className={`rounded-2xl border-2 border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-5 text-center ${pulse === "correct" ? "animate-pulse border-[var(--success)]" : pulse === "wrong" ? "border-[var(--danger)]" : ""}`}>
            <p className="mb-4 text-sm italic text-[var(--ink-dim)]">💡 {puzzle.hint}</p>
            {mode === 3 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold text-[var(--ink)]">
                {(puzzle as Level3).parts.map((part, i) =>
                  part === "" ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => (selected ? placeAtSlot(selected, 0) : slots[0] && moveToSource(0))}
                      onDragOver={(e) => onSlotDragOver(e, 0)}
                      onDrop={(e) => onSlotDrop(e, 0)}
                      className={`inline-flex h-14 min-w-16 items-center justify-center rounded-lg border-b-4 border-dashed bg-[var(--ground)] px-3 font-khmer transition ${overSlot === 0 && dragging ? "border-[var(--success)] bg-[var(--success)]/15" : selected ? "border-[var(--gold)]" : "border-[var(--slate-accent)]"}`}
                    >
                      {slots[0] ?? ""}
                    </button>
                  ) : (
                    <span key={i} className="font-khmer">{part}</span>
                  )
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {slots.map((value, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => (selected ? placeAtSlot(selected, i) : value && moveToSource(i))}
                    onDragOver={(e) => onSlotDragOver(e, i)}
                    onDrop={(e) => onSlotDrop(e, i)}
                    className={`inline-flex min-h-14 min-w-14 items-center justify-center rounded-xl border-2 px-2 text-lg font-bold transition ${value ? "border-[var(--gold)] bg-[var(--gold)]/10 font-khmer text-[var(--ink)]" : overSlot === i && dragging ? "border-[var(--success)] bg-[var(--success)]/15" : selected ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-faint)]"}`}
                  >
                    {value ?? i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Source pieces */}
          <div
            onDragOver={onSourceDragOver}
            onDragLeave={() => setOverSource(false)}
            onDrop={onSourceDrop}
          >
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">{t("Drag or tap pieces below", "អូស ឬចុចពាក្យខាងក្រោម")}</p>
            <div className={`flex min-h-16 flex-wrap justify-center gap-2 rounded-xl border p-3 transition ${overSource && dragging ? "border-[var(--success)] bg-[var(--success)]/10" : "border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)]/30"}`}>
              {source.length === 0 && <span className="py-2 text-xs text-[var(--ink-faint)]">{t("All pieces placed.", "បានដាក់ទាំងអស់ហើយ។")}</span>}
              {source.map((piece) => (
                <button
                  key={piece}
                  type="button"
                  draggable
                  onDragStart={(e) => onDragStart(piece, e)}
                  onDragEnd={onDragEnd}
                  onClick={() => {
                    setSelected((prev) => (prev === piece ? null : piece));
                    playSound("click");
                  }}
                  className={`min-w-14 cursor-grab rounded-xl border-2 bg-[var(--ground)] px-4 py-3 text-lg font-bold font-khmer transition hover:-translate-y-0.5 active:cursor-grabbing ${dragging === piece ? "opacity-40" : ""} ${selected === piece ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink)]"}`}
                >
                  {piece}
                </button>
              ))}
            </div>
            {selected && (
              <p className="mt-2 text-center text-xs text-[var(--gold)]">
                {t(`Selected "${selected}" — tap a slot to place it.`, `បានជ្រើស "${selected}" — ចុចចន្លោះដើម្បីដាក់។`)}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className={`${actionBtn} !border-[var(--danger)]/40 !text-[var(--danger)]`} onClick={resetLevel}><RotateCcw size={15} />{t("Rearrange", "រៀបឡើងវិញ")}</button>
            <button type="button" onClick={checkAnswer} className="inline-flex items-center gap-2 rounded-xl bg-[var(--success)] px-6 py-2.5 text-sm font-bold text-[#0a0c0d] transition hover:brightness-110">
              <Check size={16} /> {t("Check Answer", "ពិនិត្យចម្លើយ")}
            </button>
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="space-y-5 py-8 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]"><Trophy size={52} /></div>
          <h2 className="font-display text-3xl font-bold text-[var(--success)]">{t("Congratulations!", "អបអរសាទរ!")}</h2>
          <p className="text-lg text-[var(--ink-dim)]">{t(`You finished the level! Total score: ${score} points.`, `អ្នកបានបញ្ចប់កម្រិត! ពិន្ទុសរុប៖ ${score} ពិន្ទុ។`)}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className={actionBtn} onClick={goMenu}>{t("Back to menu", "ត្រឡប់ទៅម៉ឺនុយ")}</button>
            <button type="button" onClick={continuePlaying} className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-6 py-2.5 text-sm font-bold text-[#0a0c0d] transition hover:brightness-110">
              <Sparkles size={16} /> {t("Continue Playing", "លេងបន្តទៀត")}
            </button>
          </div>
        </div>
      )}

      {/* Feedback overlay */}
      {feedback && (
        <div className={`pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 bg-[var(--ground-raised)] px-8 py-4 text-2xl font-bold shadow-[var(--shadow-elev)] ${feedback.type === "correct" ? "border-[var(--success)] text-[var(--success)]" : "border-[var(--danger)] text-[var(--danger)]"}`}>
          {feedback.text}
        </div>
      )}

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confetti.map((i) => (
            <span
              key={i}
              className="absolute block animate-[confetti_3s_linear_forwards]"
              style={{
                left: `${(i * 137.5) % 100}%`,
                top: "-4%",
                width: `${6 + (i % 5)}px`,
                height: `${8 + (i % 7)}px`,
                background: ["#fde047", "#3b82f6", "#22c55e", "#ef4444", "#a855f7"][i % 5],
                transform: `rotate(${i * 40}deg)`,
                animationDelay: `${(i % 20) * 0.06}s`,
              }}
            />
          ))}
          <style>{`@keyframes confetti { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(110vh) rotate(720deg); } }`}</style>
        </div>
      )}
    </ToolShell>
  );
}
