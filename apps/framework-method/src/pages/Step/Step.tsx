import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiChevronLeft, FiBook, FiLink, FiZap, FiCheck, FiMoreHorizontal } from "react-icons/fi";
import { Card, Button } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";

type SectionKey = "concepts" | "reference" | "examples";

const Step = () => {
  const { stepId } = useParams<{ stepId: string }>();
  const { t } = useI18n();
  const [reflections, setReflections] = useState<Record<SectionKey, string>>({
    concepts: "",
    reference: "",
    examples: "",
  });

  const sections: { key: SectionKey; icon: typeof FiBook; title: string; label: string; content: string; hint: string; placeholder: string }[] = [
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
        'Case Study Alpha: Customer support tickets spiked by 40%. Initial assumption was a flawed product release. Step 1 analysis revealed the root cause was actually a recent update to the help documentation UI making it unusable, not the product itself.',
      hint: "Can you recall a time when a symptom masked the true root cause?",
      placeholder: "Note any similar patterns you've observed...",
    },
  ];

  const completedCount = Object.values(reflections).filter(Boolean).length;
  const total = sections.length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/overview" className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600">
          <FiChevronLeft className="w-4 h-4" /> {t("step.backToFramework")}
        </Link>
        <span className="text-sm font-medium text-primary-600">{t("step.stepOf", { current: stepId || 1, total: 5 })}</span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Framework Phase: Discovery
        </p>
        <h1 className="text-3xl font-bold mt-1 leading-tight">Step 1: Analyzing Situations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          Before proposing solutions, it is critical to thoroughly understand the current context. This step involves dissecting the problem space, identifying key stakeholders, and mapping out existing constraints and opportunities to ensure a robust foundation for subsequent phases.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-48">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"
          alt="Step"
          className="w-full h-full object-cover"
        />
      </div>

      {sections.map((section) => (
        <Card key={section.key} className="overflow-hidden p-0">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <section.icon className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600">{section.label}</span>
            </div>
            <h3 className="text-lg font-bold mb-2">{section.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {section.content}
            </p>
            {section.key === "examples" && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 italic">
                &quot;Instead of saying &apos;batteries are expensive,&apos; identify the cost of the raw materials making up the battery.&quot;
              </p>
            )}
          </div>
          <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Reflection</p>
            <textarea
              value={reflections[section.key]}
              onChange={(e) => setReflections((prev) => ({ ...prev, [section.key]: e.target.value }))}
              className="input h-24 resize-none"
              placeholder={section.placeholder}
            />
            <p className="text-xs text-gray-400 mt-2 italic">Hint: {section.hint}</p>
          </div>
        </Card>
      ))}

      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
            <FiCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">All reflections captured</p>
            <p className="text-xs text-gray-500">{completedCount} of {total} inputs completed</p>
          </div>
        </div>
        <FiMoreHorizontal className="w-5 h-5 text-gray-400" />
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Your analysis is complete. Based on your reflections, we are ready to select the optimal tool for the next phase.
      </p>

      <Button variant="dark" size="lg" className="w-full">
        {t("step.completeStep")}
      </Button>
    </div>
  );
};

export default Step;
