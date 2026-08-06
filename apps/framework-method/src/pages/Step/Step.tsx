import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiBook, FiLink, FiZap, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";
import { useFrameworkProgress } from "../../hooks/useFrameworkProgress";

type SectionKey = "concepts" | "reference" | "examples";

interface Section {
  key: SectionKey;
  icon: typeof FiBook;
  title: string;
  label: string;
  content: string;
  exampleQuote?: string;
  hint: string;
  placeholder: string;
}

const stepData: Record<number, { phase: string; title: string; desc: string; image: string }> = {
  1: {
    phase: "Discovery",
    title: "Analyzing Situations",
    desc: "Before proposing solutions, it is critical to thoroughly understand the current context. This step involves dissecting the problem space, identifying key stakeholders, and mapping out existing constraints and opportunities.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
  },
  2: {
    phase: "Deconstruction",
    title: "Deconstruct the Problem",
    desc: "Break down the core challenge into its most fundamental truths. Ignore previous assumptions and established conventions to find the root causes.",
    image: "https://images.unsplash.com/photo-1517245386807-b9b94f07e22d?auto=format&fit=crop&w=800&q=80",
  },
  3: {
    phase: "Synthesis",
    title: "Identify Fundamental Truths",
    desc: "Separate facts from assumptions to establish a solid foundation before building a solution.",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa0f91?auto=format&fit=crop&w=800&q=80",
  },
  4: {
    phase: "Strategy",
    title: "Synthesize New Solutions",
    desc: "Reassemble the truths to form innovative approaches that address the root cause directly.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
  },
  5: {
    phase: "Execution",
    title: "Execute with Confidence",
    desc: "Turn strategy into concrete actions and measure results against the defined objectives.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  },
};

const Step = () => {
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { progress, saveReflection, completeStep } = useFrameworkProgress();
  const currentStep = Math.min(Math.max(parseInt(stepId || "1", 10), 1), 5);
  const data = stepData[currentStep];

  const [reflections, setReflections] = useState<Record<SectionKey, string>>({
    concepts: "",
    reference: "",
    examples: "",
  });
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    concepts: true,
    reference: true,
    examples: true,
  });

  useEffect(() => {
    const saved = progress.reflections[String(currentStep)] || {};
    setReflections({
      concepts: saved.concepts || "",
      reference: saved.reference || "",
      examples: saved.examples || "",
    });
  }, [currentStep, progress.reflections]);

  const handleChange = (key: SectionKey, value: string) => {
    setReflections((prev) => ({ ...prev, [key]: value }));
    saveReflection(String(currentStep), key, value);
  };

  const handleComplete = () => {
    completeStep(currentStep);
    if (currentStep < 5) {
      navigate(`/step/${currentStep + 1}`);
    } else {
      navigate("/overview");
    }
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections: Section[] = [
    {
      key: "concepts",
      icon: FiBook,
      title: t("step.concepts"),
      label: "Knowledge / Theory",
      content:
        "Analyzing a situation effectively requires separating symptoms from root causes. Key theories applied here include Systems Thinking, where the problem is viewed as part of an interconnected web rather than in isolation, and Stakeholder Theory, ensuring all voices impacted by potential changes are accounted for. The goal is to build a comprehensive \"Current State Assessment\" document.",
      hint: "How does this concept apply to your current problem?",
      placeholder: "Type your thoughts here...",
    },
    {
      key: "reference",
      icon: FiLink,
      title: t("step.reference"),
      label: "Reference",
      content:
        "- McKinsey 7S Framework Guidelines\n- SWOT Analysis Templates & Best Practices\n- Root Cause Analysis (5 Whys Technique) Overview\n- Internal Documentation: Previous Q3 Project Post-Mortems",
      hint: "Identify which framework best fits your current data set.",
      placeholder: "Which references are most relevant?",
    },
    {
      key: "examples",
      icon: FiZap,
      title: t("step.examples"),
      label: "Example",
      content:
        "Case Study Alpha: Customer support tickets spiked by 40%. Initial assumption was a flawed product release. Step 1 analysis revealed the root cause was actually a recent update to the help documentation UI making it unusable, not the product itself.",
      exampleQuote:
        "\"Instead of saying 'batteries are expensive,' identify the cost of the raw materials making up the battery.\"",
      hint: "Can you recall a time when a symptom masked the true root cause?",
      placeholder: "Note any similar patterns you've observed...",
    },
  ];

  const completedCount = Object.values(reflections).filter(Boolean).length;
  const total = sections.length;
  const allCompleted = completedCount === total;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Framework Phase: {data.phase}
        </span>
      </div>

      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">Step {currentStep}: {data.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed max-w-xl mx-auto">
          {data.desc}
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-48 md:h-64">
        <img src={data.image} alt="Step" className="w-full h-full object-cover" />
      </div>

      {sections.map((section) => {
        const isOpen = openSections[section.key];
        return (
          <Card key={section.key} className="overflow-hidden p-0">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <section.icon className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-lg">{section.title}</span>
              </div>
              {isOpen ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-5 space-y-4">
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-primary-900/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-2">
                    <section.icon className="w-4 h-4" /> {section.label}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                  {section.exampleQuote && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 italic">
                      {section.exampleQuote}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Reflection</p>
                  <textarea
                    value={reflections[section.key]}
                    onChange={(e) => handleChange(section.key, e.target.value)}
                    className="input h-24 resize-none bg-blue-50/40 dark:bg-primary-900/10 border-blue-100 dark:border-primary-900/30"
                    placeholder={section.placeholder}
                  />
                  <p className="text-xs text-gray-400 mt-2 italic">Hint: {section.hint}</p>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <Card className="flex items-center gap-4 p-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${allCompleted ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{allCompleted ? t("step.allReflectionsCaptured") : "Reflections in progress"}</p>
          <p className="text-xs text-gray-500">{completedCount} of {total} inputs completed</p>
        </div>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {allCompleted
          ? "Your analysis is complete. Based on your reflections, we are ready to select the optimal tool for the next phase."
          : "Fill in all reflections to complete this step."}
      </p>

      <Button
        variant="dark"
        size="lg"
        className="w-full"
        disabled={!allCompleted}
        onClick={handleComplete}
      >
        {t("step.completeStep")}
      </Button>
    </div>
  );
};

export default Step;
