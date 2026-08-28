"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

type Cat = "geo" | "science" | "history" | "cambodia";

interface Question {
  cat: Cat;
  q: [string, string];
  opts: [string, string][];
  a: number;
}

// Curated general-knowledge bank: world geography, science, history basics,
// and Khmer/Cambodia culture. Only widely documented facts are included.
const QUESTIONS: Question[] = [
  { cat: "geo", q: ["What is the capital of Australia?", "តើរដ្ឋធានីនៃប្រទេសអូស្ត្រាលីគឺជាអ្វី?"], opts: [["Canberra", "Canberra"], ["Sydney", "Sydney"], ["Melbourne", "Melbourne"], ["Perth", "Perth"]], a: 0 },
  { cat: "geo", q: ["Which continent is the Sahara Desert in?", "វាលខ្សាច់សាហារ៉ាស្ថិតនៅទ្វីបណា?"], opts: [["Africa", "អាហ្វ្រិក"], ["Asia", "អាស៊ី"], ["Australia", "អូស្ត្រាលី"], ["South America", "អាមេរិកខាងត្បូង"]], a: 0 },
  { cat: "geo", q: ["Mount Everest lies on the border of Nepal and which country?", "ភ្នំអេវឺរេសស្ថិតនៅព្រំដែននេប៉ាល់ និងប្រទេសណា?"], opts: [["China", "ចិន"], ["India", "ឥណ្ឌា"], ["Bhutan", "ប៊ូតាន"], ["Pakistan", "ប៉ាគីស្ថាន"]], a: 0 },
  { cat: "geo", q: ["Which is the smallest country in the world by area?", "តើប្រទេសណាតូចជាងគេបំផុតនៅលើពិភពលោកតាមផ្ទៃដី?"], opts: [["Vatican City", "វ៉ាទីកង់"], ["Monaco", "ម៉ូណាកូ"], ["Singapore", "សិង្ហបុរី"], ["Malta", "ម៉ាល់តា"]], a: 0 },
  { cat: "geo", q: ["The Amazon rainforest is mostly located in which country?", "ព្រៃអាម៉ាហ្សូនស្ថិតនៅក្នុងប្រទេសណាច្រើនជាងគេ?"], opts: [["Brazil", "ប្រេស៊ីល"], ["Peru", "ប៉េរូ"], ["Colombia", "កូឡុំប៊ី"], ["Venezuela", "វេណេស៊ុយអេឡា"]], a: 0 },
  { cat: "geo", q: ["Which is the largest ocean?", "តើមហាសមុទ្រណាធំជាងគេ?"], opts: [["Pacific", "ប៉ាស៊ីហ្វិក"], ["Atlantic", "អាត្លង់ទិក"], ["Indian", "ឥណ្ឌា"], ["Arctic", "អាកទិក"]], a: 0 },
  { cat: "geo", q: ["What is the capital of Canada?", "តើរដ្ឋធានីកាណាដាគឺជាអ្វី?"], opts: [["Ottawa", "Ottawa"], ["Toronto", "Toronto"], ["Vancouver", "Vancouver"], ["Montreal", "Montreal"]], a: 0 },
  { cat: "geo", q: ["Which of these is a Scandinavian country?", "តើប្រទេសណាខាងក្រោមស្ថិតក្នុងស្កែនឌីណាវ៉ា?"], opts: [["Norway", "ន័រវេស"], ["Switzerland", "ស្វីស"], ["Austria", "អូទ្រីស"], ["Belgium", "បែលហ្ស៊ិក"]], a: 0 },
  { cat: "geo", q: ["What is the longest mountain range on land?", "តើជួរភ្នំណាវែងជាងគេនៅលើដី?"], opts: [["Andes", "អង់ដេស"], ["Himalayas", "ហិម៉ាឡៃយ៉ា"], ["Rockies", "រ៉ក់គី"], ["Alps", "អាល់"]], a: 0 },
  { cat: "geo", q: ["Which river flows through Cairo?", "តើទន្លេណាហូរកាត់ទីក្រុងកៃរ៉ូ?"], opts: [["Nile", "នីល"], ["Amazon", "អាម៉ាហ្សូន"], ["Danube", "ដានូប"], ["Tigris", "ទីគ្រីស"]], a: 0 },
  { cat: "geo", q: ["The Great Barrier Reef lies off which country's coast?", "ថ្មប៉ប្រះទឹក Great Barrier Reef ស្ថិតនៅឆ្នេរប្រទេសណា?"], opts: [["Australia", "អូស្ត្រាលី"], ["Indonesia", "ឥណ្ឌូនេស៊ី"], ["Philippines", "ហ្វីលីពីន"], ["Thailand", "ថៃ"]], a: 0 },
  { cat: "geo", q: ["Which country is called the Land of the Rising Sun?", "តើប្រទេសណាត្រូវបានគេហៅថាទឹកដីព្រះអាទិត្យរះ?"], opts: [["Japan", "ជប៉ុន"], ["South Korea", "កូរ៉េខាងត្បូង"], ["China", "ចិន"], ["Thailand", "ថៃ"]], a: 0 },
  { cat: "geo", q: ["Which country currently has the largest population?", "បច្ចុប្បន្នប្រទេសណាមានប្រជាជនច្រើនជាងគេ?"], opts: [["India", "ឥណ្ឌា"], ["China", "ចិន"], ["United States", "សហរដ្ឋអាមេរិក"], ["Indonesia", "ឥណ្ឌូនេស៊ី"]], a: 0 },
  { cat: "geo", q: ["The Nile is a major river flowing through which continent?", "ទន្លេនីលហូរកាត់ទ្វីបណា?"], opts: [["Africa", "អាហ្វ្រិក"], ["Asia", "អាស៊ី"], ["Europe", "អឺរ៉ុប"], ["South America", "អាមេរិកខាងត្បូង"]], a: 0 },

  { cat: "science", q: ["What is the chemical symbol for gold?", "តើនិមិត្តសញ្ញាគីមីនៃមាសគឺជាអ្វី?"], opts: [["Au", "Au"], ["Ag", "Ag"], ["Fe", "Fe"], ["G", "G"]], a: 0 },
  { cat: "science", q: ["How many planets are in our solar system?", "តើប្រព័ន្ធព្រះអាទិត្យមានភពប៉ុន្មាន?"], opts: [["8", "៨"], ["7", "៧"], ["9", "៩"], ["10", "១០"]], a: 0 },
  { cat: "science", q: ["Which planet is known as the Red Planet?", "តើភពណាត្រូវបានគេហៅថាភពក្រហម?"], opts: [["Mars", "ភពអង្គារ"], ["Venus", "ភពសុក្រ"], ["Jupiter", "ភពព្រហស្បតិ៍"], ["Mercury", "ភពពុធ"]], a: 0 },
  { cat: "science", q: ["What is H2O commonly known as?", "តើ H2O ត្រូវបានគេស្គាល់ទូទៅថាជាអ្វី?"], opts: [["Water", "ទឹក"], ["Salt", "អំបិល"], ["Oxygen", "អុកស៊ីសែន"], ["Hydrogen", "អ៊ីដ្រូសែន"]], a: 0 },
  { cat: "science", q: ["Which force pulls objects toward Earth?", "តើកម្លាំងណាទាញវត្ថុឱ្យធ្លាក់មកផែនដី?"], opts: [["Gravity", "ទំនាញ"], ["Magnetism", "ម៉ាញេទិក"], ["Friction", "កកិត"], ["Pressure", "សម្ពាធ"]], a: 0 },
  { cat: "science", q: ["What is the largest organ of the human body?", "តើសរីរាង្គណាធំជាងគេក្នុងរាងកាយមនុស្ស?"], opts: [["Skin", "ស្បែក"], ["Liver", "ថ្លើម"], ["Lungs", "សួត"], ["Heart", "បេះដូង"]], a: 0 },
  { cat: "science", q: ["How many bones does an adult human have?", "តើមនុស្សពេញវ័យមានឆ្អឹងប៉ុន្មាន?"], opts: [["206", "២០៦"], ["106", "១០៦"], ["306", "៣០៦"], ["156", "១៥៦"]], a: 0 },
  { cat: "science", q: ["Which gas do plants absorb from the air?", "តើរុក្ខជាតិស្រូបឧស្ម័នណាពីខ្យល់?"], opts: [["Carbon dioxide", "កាបូនឌីអុកស៊ីត"], ["Oxygen", "អុកស៊ីសែន"], ["Nitrogen", "អាសូត"], ["Hydrogen", "អ៊ីដ្រូសែន"]], a: 0 },
  { cat: "science", q: ["Which is the largest planet in the solar system?", "តើភពណាធំជាងគេក្នុងប្រព័ន្ធព្រះអាទិត្យ?"], opts: [["Jupiter", "ភពព្រហស្បតិ៍"], ["Saturn", "ភពសៅរ៍"], ["Neptune", "ភពណិបទូន"], ["Earth", "ភពផែនដី"]], a: 0 },
  { cat: "science", q: ["What is the approximate speed of light in a vacuum?", "តើល្បឿនពន្លឺក្នុងកន្លែងទំនេរប្រហែលប៉ុន្មាន?"], opts: [["300,000 km/s", "៣០០,០០០ គីឡូម៉ែត្រ/វិនាទី"], ["30,000 km/s", "៣០,០០០ គីឡូម៉ែត្រ/វិនាទី"], ["150,000 km/s", "១៥០,០០០ គីឡូម៉ែត្រ/វិនាទី"], ["3,000,000 km/s", "៣,០០០,០០០ គីឡូម៉ែត្រ/វិនាទី"]], a: 0 },
  { cat: "science", q: ["Which part of a cell is called its powerhouse?", "តើផ្នែកណានៃកោសិកាត្រូវបានគេហៅថារោងចក្រថាមពល?"], opts: [["Mitochondria", "មីតូខនឌ្រី"], ["Nucleus", "ស្នូល"], ["Ribosome", "រីបូសូម"], ["Membrane", "ភ្នាស"]], a: 0 },
  { cat: "science", q: ["Which vitamin does the skin make from sunlight?", "តើស្បែកផលិតវីតាមីនណាពីពន្លឺព្រះអាទិត្យ?"], opts: [["Vitamin D", "វីតាមីន D"], ["Vitamin C", "វីតាមីន C"], ["Vitamin A", "វីតាមីន A"], ["Vitamin B12", "វីតាមីន B12"]], a: 0 },
  { cat: "science", q: ["Water boils at 100°C. What is that in Fahrenheit?", "ទឹកពុះនៅ ១០០°C។ តើស្មើប៉ុន្មានអង្សាហ្វារិនហៃ?"], opts: [["212°F", "២១២°F"], ["100°F", "១០០°F"], ["180°F", "១៨០°F"], ["32°F", "៣២°F"]], a: 0 },
  { cat: "science", q: ["Which element has atomic number 6?", "តើធាតុណាមានលេខអាតូមិច ៦?"], opts: [["Carbon", "កាបូន"], ["Oxygen", "អុកស៊ីសែន"], ["Nitrogen", "អាសូត"], ["Boron", "បូរ៉ុន"]], a: 0 },
  { cat: "science", q: ["Sound travels fastest through which medium?", "សំឡេងធ្វើដំណើរលឿនជាងគេក្នុងប្រព័ន្ធណា?"], opts: [["Steel", "ដែកថែប"], ["Air", "ខ្យល់"], ["Water", "ទឹក"], ["Vacuum", "កន្លែងទំនេរ"]], a: 0 },

  { cat: "history", q: ["In which year did World War II end?", "តើសង្គ្រាមលោកលើកទី២បញ្ចប់ក្នុងឆ្នាំណា?"], opts: [["1945", "១៩៤៥"], ["1944", "១៩៤៤"], ["1946", "១៩៤៦"], ["1939", "១៩៣៩"]], a: 0 },
  { cat: "history", q: ["Who was the first president of the United States?", "តើនរណាជាប្រធានាធិបតីទីមួយរបស់សហរដ្ឋអាមេរិក?"], opts: [["George Washington", "George Washington"], ["Thomas Jefferson", "Thomas Jefferson"], ["Abraham Lincoln", "Abraham Lincoln"], ["John Adams", "John Adams"]], a: 0 },
  { cat: "history", q: ["The Great Pyramids of Giza are located in which country?", "ពីរ៉ាមីតហ្គីហ្សាស្ថិតនៅក្នុងប្រទេសណា?"], opts: [["Egypt", "អេហ្ស៊ីប"], ["Mexico", "ម៉ិកស៊ិក"], ["Peru", "ប៉េរូ"], ["Greece", "ក្រិក"]], a: 0 },
  { cat: "history", q: ["Who painted the Mona Lisa?", "តើនរណាជាអ្នកគូររូបម៉ូណាលីសា?"], opts: [["Leonardo da Vinci", "Leonardo da Vinci"], ["Michelangelo", "Michelangelo"], ["Raphael", "Raphael"], ["Van Gogh", "Van Gogh"]], a: 0 },
  { cat: "history", q: ["In which year did the Berlin Wall fall?", "តើជញ្ជាំងប៊ែរឡាំងដួលរលំក្នុងឆ្នាំណា?"], opts: [["1989", "១៩៨៩"], ["1985", "១៩៨៥"], ["1991", "១៩៩១"], ["1979", "១៩៧៩"]], a: 0 },
  { cat: "history", q: ["Which empire built the Colosseum in Rome?", "តើអាណាចក្រណាបានកសាងកូលីសេអ៊ូមនៅទីក្រុងរ៉ូម?"], opts: [["Roman", "រ៉ូម៉ាំង"], ["Greek", "ក្រិក"], ["Egyptian", "អេហ្ស៊ីប"], ["Persian", "ពែរ្ស"]], a: 0 },
  { cat: "history", q: ["World War I began in which year?", "តើសង្គ្រាមលោកលើកទី១ចាប់ផ្តើមក្នុងឆ្នាំណា?"], opts: [["1914", "១៩១៤"], ["1918", "១៩១៨"], ["1905", "១៩០៥"], ["1920", "១៩២០"]], a: 0 },
  { cat: "history", q: ["Who wrote Romeo and Juliet?", "តើនរណាជាអ្នកនិពន្ធរឿង Romeo and Juliet?"], opts: [["William Shakespeare", "William Shakespeare"], ["Charles Dickens", "Charles Dickens"], ["Jane Austen", "Jane Austen"], ["Mark Twain", "Mark Twain"]], a: 0 },
  { cat: "history", q: ["The French Revolution began in which year?", "តើបដិវត្តន៍បារាំងចាប់ផ្តើមក្នុងឆ្នាំណា?"], opts: [["1789", "១៧៨៩"], ["1804", "១៨០៤"], ["1776", "១៧៧៦"], ["1815", "១៨១៥"]], a: 0 },
  { cat: "history", q: ["Which civilization built Machu Picchu?", "តើអរិយធម៌ណាបានកសាងម៉ាឈូប៉ិចឈូ?"], opts: [["Inca", "អ៊ីនកា"], ["Maya", "ម៉ាយ៉ា"], ["Aztec", "អាហ្សេត"], ["Olmec", "អូលមេក"]], a: 0 },

  { cat: "cambodia", q: ["What is the capital of Cambodia?", "តើរដ្ឋធានីកម្ពុជាគឺជាអ្វី?"], opts: [["Phnom Penh", "ភ្នំពេញ"], ["Siem Reap", "សៀមរាប"], ["Battambang", "បាត់ដំបង"], ["Kampong Cham", "កំពង់ចាម"]], a: 0 },
  { cat: "cambodia", q: ["Angkor Wat was originally built as a temple for which religion?", "ដើមឡើយអង្គរវត្តត្រូវបានសាងសង់ជាប្រាសាទសម្រាប់សាសនាណា?"], opts: [["Hinduism", "ព្រហ្មញ្ញសាសនា"], ["Buddhism", "ព្រះពុទ្ធសាសនា"], ["Islam", "សាសនាឥស្លាម"], ["Christianity", "សាសនាគ្រិស្ត"]], a: 0 },
  { cat: "cambodia", q: ["Which lake in Cambodia is the largest freshwater lake in Southeast Asia?", "តើបឹងណានៅកម្ពុជាជាបឹងទឹកសាបធំជាងគេនៅអាស៊ីអាគ្នេយ៍?"], opts: [["Tonlé Sap", "ទន្លេសាប"], ["Boeng Kak", "បឹងកាក់"], ["Boeng Trabek", "បឹងត្របែក"], ["Boeng Chhouk", "បឹងឈូក"]], a: 0 },
  { cat: "cambodia", q: ["What is the currency of Cambodia?", "តើរូបិយប័ណ្ណរបស់កម្ពុជាគឺជាអ្វី?"], opts: [["Riel", "រៀល"], ["Baht", "បាត"], ["Dong", "ដុង"], ["Ringgit", "រីងហ្គីត"]], a: 0 },
  { cat: "cambodia", q: ["In which century was Angkor Wat built?", "តើអង្គរវត្តត្រូវបានសាងសង់ក្នុងសតវត្សទីប៉ុន្មាន?"], opts: [["12th", "ទី១២"], ["10th", "ទី១០"], ["14th", "ទី១៤"], ["16th", "ទី១៦"]], a: 0 },
  { cat: "cambodia", q: ["Which Khmer king built Angkor Wat?", "តើព្រះមហាក្សត្រខ្មែរណាបានកសាងអង្គរវត្ត?"], opts: [["Suryavarman II", "សូរ្យវរ្ម័នទី២"], ["Jayavarman VII", "ជយវរ្ម័នទី៧"], ["Indravarman I", "ឥន្ទ្រវរ្ម័នទី១"], ["Yasovarman I", "យសោវរ្ម័នទី១"]], a: 0 },
  { cat: "cambodia", q: ["The Angkor temples were the capital of which empire?", "ប្រាសាទអង្គរជារាជធានីនៃអាណាចក្រណា?"], opts: [["Khmer Empire", "អាណាចក្រខ្មែរ"], ["Champa", "ចាម្ប៉ា"], ["Srivijaya", "ស្រីវិជ័យ"], ["Ayutthaya", "អយុធ្យា"]], a: 0 },
  { cat: "cambodia", q: ["What is the national language of Cambodia?", "តើភាសាជាតិរបស់កម្ពុជាគឺជាអ្វី?"], opts: [["Khmer", "ភាសាខ្មែរ"], ["Vietnamese", "វៀតណាម"], ["Thai", "ថៃ"], ["Lao", "ឡាវ"]], a: 0 },
  { cat: "cambodia", q: ["In which month is the Cambodian New Year (Choul Chnam Thmey) celebrated?", "តើចូលឆ្នាំខ្មែរប្រារព្ធក្នុងខែណា?"], opts: [["April", "ខែមេសា"], ["January", "ខែមករា"], ["December", "ខែធ្នូ"], ["August", "ខែសីហា"]], a: 0 },
  { cat: "cambodia", q: ["Which province is home to the Angkor temples?", "តើខេត្តណាជាទីតាំងនៃប្រាសាទអង្គរ?"], opts: [["Siem Reap", "សៀមរាប"], ["Battambang", "បាត់ដំបង"], ["Kampong Thom", "កំពង់ធំ"], ["Banteay Meanchey", "បន្ទាយមានជ័យ"]], a: 0 },
  { cat: "cambodia", q: ["What is the traditional woven skirt-like garment worn in Cambodia called?", "តើសំពត់បុរាណខ្មែរដែលត្បាញហៅថាអ្វី?"], opts: [["Sampot", "សំពត់"], ["Sarong", "សារ៉ុង"], ["Kebaya", "កេបាយ៉ា"], ["Ao Dai", "អាវយ៉ៃ"]], a: 0 },
];

const CAT_LABEL: Record<Cat, [string, string]> = {
  geo: ["Geography", "ភូមិសាស្ត្រ"],
  science: ["Science", "វិទ្យាសាស្ត្រ"],
  history: ["History", "ប្រវត្តិសាស្ត្រ"],
  cambodia: ["Cambodia", "កម្ពុជា"],
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Shuffles question order and the options inside each question.
const prepare = (qs: Question[]): Question[] =>
  qs.map((q) => {
    const order = shuffle(q.opts.map((_, i) => i));
    return { ...q, opts: order.map((i) => q.opts[i]), a: order.indexOf(q.a) };
  });

export default function TriviaQuiz() {
  const { text: t } = useLanguage();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const start = () => {
    setQuestions(prepare(shuffle(QUESTIONS)));
    setCurrent(0);
    setScore(0);
    setPicked(null);
    setStarted(true);
    setDone(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === questions[current].a) setScore((s) => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) setDone(true);
    else {
      setCurrent((c) => c + 1);
      setPicked(null);
    }
  };

  const q = questions[current];
  const pct = questions.length > 0 ? Math.round(((current + (picked !== null ? 1 : 0)) / questions.length) * 100) : 0;

  return (
    <ToolShell
      title="Trivia Quiz"
      khmerTitle="ល្បែងសំណួរចំណេះទូទៅ"
      description="Test yourself with 50 curated general-knowledge questions — geography, science, history, and Cambodia."
      descriptionKm="សាកល្បងខ្លួនឯងជាមួយសំណួរចំណេះទូទៅចំនួន ៥០ — ភូមិសាស្ត្រ វិទ្យាសាស្ត្រ ប្រវត្តិសាស្ត្រ និងកម្ពុជា។"
    >
      <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Curated general-knowledge questions for fun and learning — not an exam.", "កម្រងសំណួរចំណេះទូទៅដែលបានជ្រើសរើស សម្រាប់ការកម្សាន្ត និងរៀន — មិនមែនជាការប្រឡងទេ។")}
      </p>

      {!started ? (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
          <p className="text-sm leading-relaxed text-[var(--ink-dim)]">
            {t("50 questions, 4 choices each. Your score updates as you go.", "សំណួរ ៥០ មាន ៤ ជម្រើស។ ពិន្ទុរបស់អ្នកនឹងកើនឡើងតាមដំណើរការ។")}
          </p>
          <Button onClick={start} className="mt-4">{t("Start quiz", "ចាប់ផ្តើមលេង")}</Button>
        </div>
      ) : done || !q ? (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
          <div className="text-4xl font-semibold text-[var(--gold)]">{score}/{questions.length}</div>
          <div className="mt-1 text-sm text-[var(--ink-dim)]">
            {t("questions correct", "ចម្លើយត្រឹមត្រូវ")} ({questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%)
          </div>
          <Button onClick={start} className="mt-4">{t("Play again", "លេងម្តងទៀត")}</Button>
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono-ui text-[var(--ink)]">{current + 1}/{questions.length}</span>
            <span className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t(CAT_LABEL[q.cat][0], CAT_LABEL[q.cat][1])}</span>
            <span className="font-medium text-[var(--gold)]">{t("Score", "ពិន្ទុ")}: {score}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
            <div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <p className="text-base font-medium leading-relaxed text-[var(--ink)]">{t(q.q[0], q.q[1])}</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {q.opts.map((o, i) => {
              const isCorrect = picked !== null && i === q.a;
              const isPicked = picked === i;
              const cls = picked === null
                ? "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold-dim)]"
                : isCorrect
                  ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--ink)]"
                  : isPicked
                    ? "border-[var(--danger)]/60 bg-[var(--danger)]/15 text-[var(--danger)]"
                    : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-faint)]";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`rounded-md border px-4 py-2.5 text-left text-sm transition ${cls}`}
                >
                  {t(o[0], o[1])}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--ink-dim)]">
                {picked === q.a
                  ? t("Correct!", "ត្រឹមត្រូវ!")
                  : t(`Wrong — the answer is ${q.opts[q.a][0]}.`, `មិនត្រឹមត្រូវ — ចម្លើយគឺ ${q.opts[q.a][1]}។`)}
              </p>
              <Button onClick={next}>{current + 1 >= questions.length ? t("See results", "មើលលទ្ធផល") : t("Next", "បន្ទាប់")}</Button>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
