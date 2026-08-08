import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuthContext } from "@superapp/iam";
import * as service from "../services/frameworkMethodService";
import type {
  Block,
  BlockId,
  BlockStats,
  DailyTask,
  ReferenceInput,
  ApplyPlan,
  Track,
  Session,
  Streak,
  StepType,
  Template,
  TaskSource,
  TaskSuggestion,
  KnowledgeEntry,
} from "../types";

interface SessionContextType {
  userId: string | null;
  sessionDate: string;
  setSessionDate: (date: string) => void;
  blocks: Block[];
  currentBlockIndex: number;
  setCurrentBlockIndex: (index: number) => void;
  currentBlock: Block | null;
  step: number;
  setStep: (step: number) => void;
  session: Session | null;
  tasks: DailyTask[];
  pendingCarryOver: DailyTask[];
  addTask: (blockId: BlockId, title: string, source?: TaskSource) => Promise<DailyTask | undefined>;
  toggleTask: (taskId: string) => Promise<void>;
  updateTaskTitle: (taskId: string, title: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<DailyTask>) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  setPlannedCompletionRate: (rate: number) => Promise<void>;
  refreshMerit: () => Promise<void>;
  merit: { earned: number; spent: number; total: number; adjustment: number };
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  referenceInputs: Record<string, ReferenceInput>;
  saveReferenceInput: (sectionId: string, itemId: string, content: string, isEnabled: boolean) => Promise<void>;
  applyPlans: Record<string, ApplyPlan>;
  saveApplyPlan: (taskId: string, planData: Record<string, string>) => Promise<void>;
  tracks: Record<string, Track>;
  saveTrack: (taskId: string, fields: { dich: string; thuc_te: string; phuong_phap: string }) => Promise<void>;
  blockStats: Record<BlockId, BlockStats>;
  streak: Streak | null;
  templates: Record<BlockId, Record<StepType, Template>>;
  getTemplate: (blockId: BlockId, stepType: StepType) => Template | null;
  updateTemplate: (blockId: BlockId, stepType: StepType, updater: (template: Template) => Template) => void;
  saveTemplates: () => Promise<void>;
  taskSuggestions: Record<BlockId, TaskSuggestion[]>;
  updateTaskSuggestions: (blockId: BlockId, suggestions: TaskSuggestion[]) => Promise<void>;
  knowledgeEntries: KnowledgeEntry[];
  addKnowledgeEntry: (entry: Omit<KnowledgeEntry, "id" | "order_index" | "created_at" | "updated_at">) => Promise<void>;
  updateKnowledgeEntry: (id: string, updates: Partial<KnowledgeEntry>) => Promise<void>;
  removeKnowledgeEntry: (id: string) => Promise<void>;
  isLoading: boolean;
  saveDraft: () => Promise<void>;
  completeSession: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

const inputKey = (sectionId: string, itemId: string) => `${sectionId}:${itemId}`;

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const userId = user?.id ?? null;

  const [sessionDate, setSessionDate] = useState(service.todayStr());
  const [isLoading, setIsLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [pendingCarryOver, setPendingCarryOver] = useState<DailyTask[]>([]);
  const [referenceInputs, setReferenceInputs] = useState<Record<string, ReferenceInput>>({});
  const [applyPlans, setApplyPlans] = useState<Record<string, ApplyPlan>>({});
  const [tracks, setTracks] = useState<Record<string, Track>>({});
  const [blockStats, setBlockStats] = useState<Record<BlockId, BlockStats>>({} as Record<BlockId, BlockStats>);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [templates, setTemplates] = useState<Record<BlockId, Record<StepType, Template>>>({} as Record<BlockId, Record<StepType, Template>>);
  const [taskSuggestions, setTaskSuggestions] = useState<Record<BlockId, TaskSuggestion[]>>({} as Record<BlockId, TaskSuggestion[]>);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [currentBlockIndex, setCurrentBlockIndexRaw] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const step = session?.current_step ?? 1;
  const currentBlock = blocks[currentBlockIndex] ?? null;

  const persistSession = useCallback(
    async (updates: Partial<Session>) => {
      if (!session) return;
      const updated = { ...session, ...updates, updated_at: new Date().toISOString() };
      await service.updateSession(session.id, updates);
      setSession(updated);
    },
    [session]
  );

  const merit = useMemo(
    () => service.calculateMerit(tasks, session?.planned_completion_rate ?? undefined),
    [tasks, session?.planned_completion_rate]
  );

  useEffect(() => {
    if (!session) return;
    if (
      session.merit_earned === merit.earned &&
      session.merit_spent === merit.spent &&
      session.merit_total === merit.total
    ) {
      return;
    }
    persistSession({
      merit_earned: merit.earned,
      merit_spent: merit.spent,
      merit_total: merit.total,
    });
  }, [session, merit, persistSession]);

  const setCurrentBlockIndex = useCallback(
    async (index: number) => {
      const block = blocks[index];
      setCurrentBlockIndexRaw(index);
      if (block) await persistSession({ current_block_id: block.id });
    },
    [blocks, persistSession]
  );

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const loadedBlocks = await service.getBlocks();
      setBlocks(loadedBlocks);

      const existingSession = await service.getSessionForDate(userId, sessionDate);
      if (existingSession) {
        setSession(existingSession);
        setCurrentBlockIndexRaw(loadedBlocks.findIndex((b) => b.id === existingSession.current_block_id) ?? 0);
      } else {
        const newSession = await service.createSession(userId, sessionDate);
        setSession(newSession);
        setCurrentBlockIndexRaw(0);
      }

      const [loadedTasks, carryOver, stats, loadedStreak, loadedTemplates, allSuggestions, loadedKnowledge] = await Promise.all([
        service.getDailyTasksForDate(userId, sessionDate),
        service.getPendingTasksBeforeDate(userId, sessionDate),
        service.getBlockStats(userId),
        service.getStreak(userId),
        service.getAllTemplates(),
        service.getAllTaskSuggestions(),
        service.getKnowledgeEntries(),
      ]);

      setTasks(loadedTasks);
      setPendingCarryOver(carryOver);
      setBlockStats(stats);
      setStreak(loadedStreak);
      setTaskSuggestions(allSuggestions);
      setKnowledgeEntries(loadedKnowledge);
      setTemplates(loadedTemplates);

      if (existingSession) {
        const [inputs, plans, trackRows] = await Promise.all([
          service.getReferenceInputsForSession(existingSession.id),
          Promise.all(loadedTasks.map((t) => service.getApplyPlanForTask(t.id))),
          Promise.all(loadedTasks.map((t) => service.getTrackForTask(t.id))),
        ]);

        const inputMap: Record<string, ReferenceInput> = {};
        inputs.forEach((i) => {
          inputMap[inputKey(i.section_id, i.item_id)] = i;
        });
        setReferenceInputs(inputMap);

        const planMap: Record<string, ApplyPlan> = {};
        plans.forEach((p) => {
          if (p) planMap[p.daily_task_id] = p;
        });
        setApplyPlans(planMap);

        const trackMap: Record<string, Track> = {};
        trackRows.forEach((tr) => {
          if (tr) trackMap[tr.daily_task_id] = tr;
        });
        setTracks(trackMap);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionDate]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, sessionDate, loadData]);

  const getTemplate = useCallback(
    (blockId: BlockId, stepType: StepType) => {
      return templates[blockId]?.[stepType] ?? null;
    },
    [templates]
  );

  const updateTemplate = useCallback(
    (blockId: BlockId, stepType: StepType, updater: (template: Template) => Template) => {
      setTemplates((prev) => {
        const current = prev[blockId]?.[stepType];
        if (!current) return prev;
        return {
          ...prev,
          [blockId]: {
            ...prev[blockId],
            [stepType]: updater(current),
          },
        };
      });
    },
    []
  );

  const saveTemplates = useCallback(async () => {
    await service.saveAllTemplates(templates);
  }, [templates]);

  const updateTaskSuggestions = useCallback(
    async (blockId: BlockId, suggestions: TaskSuggestion[]) => {
      const next = { ...taskSuggestions, [blockId]: suggestions };
      setTaskSuggestions(next);
      await service.saveTaskSuggestions(next);
    },
    [taskSuggestions]
  );

  const addKnowledgeEntry = useCallback(
    async (entry: Omit<KnowledgeEntry, "id" | "order_index" | "created_at" | "updated_at">) => {
      const newEntry: KnowledgeEntry = {
        ...entry,
        id: service.genId(),
        order_index: knowledgeEntries.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const next = [...knowledgeEntries, newEntry];
      setKnowledgeEntries(next);
      await service.saveKnowledgeEntries(next);
    },
    [knowledgeEntries]
  );

  const updateKnowledgeEntry = useCallback(
    async (id: string, updates: Partial<KnowledgeEntry>) => {
      const next = knowledgeEntries.map((e) => (e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));
      setKnowledgeEntries(next);
      await service.saveKnowledgeEntries(next);
    },
    [knowledgeEntries]
  );

  const removeKnowledgeEntry = useCallback(
    async (id: string) => {
      const next = knowledgeEntries.filter((e) => e.id !== id).map((e, i) => ({ ...e, order_index: i }));
      setKnowledgeEntries(next);
      await service.saveKnowledgeEntries(next);
    },
    [knowledgeEntries]
  );

  const addTask = useCallback(
    async (blockId: BlockId, title: string, source: TaskSource = "freetext") => {
      if (!userId || !session) return undefined;
      const task = await service.createDailyTask(userId, session.id, blockId, title, source, sessionDate);
      setTasks((prev) => [...prev, task]);
      return task;
    },
    [userId, session, sessionDate]
  );

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextStatus = task.status === "done" ? "pending" : "done";
    await service.updateDailyTask(taskId, { status: nextStatus });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
  }, [tasks]);

  const updateTaskTitle = useCallback(async (taskId: string, title: string) => {
    await service.updateDailyTask(taskId, { title });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title } : t)));
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<DailyTask>) => {
    await service.updateDailyTask(taskId, updates);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }, []);

  const setPlannedCompletionRate = useCallback(
    async (rate: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(rate)));
      await persistSession({ planned_completion_rate: clamped });
    },
    [persistSession]
  );

  const refreshMerit = useCallback(async () => {
    if (!session) return;
    await persistSession({
      merit_earned: merit.earned,
      merit_spent: merit.spent,
      merit_total: merit.total,
    });
  }, [session, merit, persistSession]);

  const removeTask = useCallback(async (taskId: string) => {
    // Soft delete via status? For now filter locally; no DB delete to keep history.
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const saveReferenceInput = useCallback(
    async (sectionId: string, itemId: string, content: string, isEnabled: boolean) => {
      if (!session) return;
      const key = inputKey(sectionId, itemId);
      const existing = referenceInputs[key];
      const input: ReferenceInput = {
        id: existing?.id ?? service.genId(),
        session_id: session.id,
        section_id: sectionId,
        item_id: itemId,
        content,
        is_enabled: isEnabled,
      };
      await service.saveReferenceInputs([input]);
      setReferenceInputs((prev) => ({ ...prev, [key]: input }));
    },
    [session, referenceInputs]
  );

  const saveApplyPlan = useCallback(
    async (taskId: string, planData: Record<string, string>) => {
      if (!session) return;
      const existing = applyPlans[taskId];
      const plan: ApplyPlan = {
        id: existing?.id ?? service.genId(),
        daily_task_id: taskId,
        session_id: session.id,
        plan_data: planData,
      };
      const saved = await service.saveApplyPlan(plan);
      if (saved) setApplyPlans((prev) => ({ ...prev, [taskId]: saved }));
    },
    [session, applyPlans]
  );

  const saveTrack = useCallback(
    async (taskId: string, fields: { dich: string; thuc_te: string; phuong_phap: string }) => {
      if (!session) return;
      const existing = tracks[taskId];
      const track: Track = {
        id: existing?.id ?? service.genId(),
        daily_task_id: taskId,
        session_id: session.id,
        ...fields,
      };
      const saved = await service.saveTrack(track);
      if (saved) setTracks((prev) => ({ ...prev, [taskId]: saved }));
    },
    [session, tracks]
  );

  const saveDraft = useCallback(async () => {
    await persistSession({
      current_step: step,
      current_block_id: currentBlock?.id,
      status: "draft",
    });
  }, [persistSession, step, currentBlock]);

  const completeSession = useCallback(async () => {
    if (!userId) return;
    await persistSession({ current_step: 4, status: "completed", ended_at: new Date().toISOString() });
    const today = service.todayStr();
    let nextStreak: Streak;
    if (!streak) {
      nextStreak = {
        id: service.genId(),
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
      };
    } else {
      nextStreak = { ...streak };
      const last = new Date(streak.last_active_date);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        nextStreak.current_streak += 1;
      } else if (diffDays > 1) {
        nextStreak.current_streak = 1;
      }
      nextStreak.longest_streak = Math.max(nextStreak.longest_streak, nextStreak.current_streak);
      nextStreak.last_active_date = today;
    }
    const saved = await service.updateStreak(nextStreak);
    if (saved) setStreak(saved);
  }, [userId, streak, persistSession]);

  const setStep = useCallback(
    async (next: number) => {
      await persistSession({ current_step: next });
    },
    [persistSession]
  );

  const value = useMemo(
    () => ({
      userId,
      sessionDate,
      setSessionDate,
      blocks,
      currentBlockIndex,
      setCurrentBlockIndex,
      currentBlock,
      step,
      setStep,
      session,
      tasks,
      pendingCarryOver,
      addTask,
      toggleTask,
      updateTaskTitle,
      updateTask,
      removeTask,
      setPlannedCompletionRate,
      refreshMerit,
      merit,
      selectedTaskId,
      setSelectedTaskId,
      referenceInputs,
      saveReferenceInput,
      applyPlans,
      saveApplyPlan,
      tracks,
      saveTrack,
      blockStats,
      streak,
      templates,
      getTemplate,
      updateTemplate,
      saveTemplates,
      taskSuggestions,
      updateTaskSuggestions,
      knowledgeEntries,
      addKnowledgeEntry,
      updateKnowledgeEntry,
      removeKnowledgeEntry,
      isLoading,
      saveDraft,
      completeSession,
      refresh: loadData,
    }),
    [
      userId,
      sessionDate,
      blocks,
      currentBlockIndex,
      currentBlock,
      step,
      session,
      tasks,
      pendingCarryOver,
      addTask,
      toggleTask,
      updateTaskTitle,
      updateTask,
      removeTask,
      setPlannedCompletionRate,
      refreshMerit,
      merit,
      selectedTaskId,
      referenceInputs,
      saveReferenceInput,
      applyPlans,
      saveApplyPlan,
      tracks,
      saveTrack,
      blockStats,
      streak,
      templates,
      getTemplate,
      updateTemplate,
      saveTemplates,
      taskSuggestions,
      updateTaskSuggestions,
      knowledgeEntries,
      addKnowledgeEntry,
      updateKnowledgeEntry,
      removeKnowledgeEntry,
      isLoading,
      saveDraft,
      completeSession,
      setCurrentBlockIndex,
      setStep,
      loadData,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
};
