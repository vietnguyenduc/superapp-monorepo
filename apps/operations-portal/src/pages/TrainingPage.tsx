import React, { useState, useEffect } from 'react';
import { supabase, TABLES, getCurrentUserId } from '../lib/supabase';
import { PlayCircleIcon, DocumentTextIcon, QuestionMarkCircleIcon, CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';
import { isTrialMode, mockTrainingCourses, mockTrainingMaterials, mockTrainingProgress } from '../lib/trialData';

const TrainingPage = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Progress
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const currentUserId = await getCurrentUserId();
    setUserId(currentUserId);

    // Trial mode: use mock data
    if (isTrialMode()) {
      setCourses(mockTrainingCourses);
      setProgress(mockTrainingProgress);
      setLoading(false);
      return;
    }

    await fetchCourses();
    if (currentUserId) {
      await fetchProgress(currentUserId);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from(TABLES.OPERATION_TRAINING_COURSES).select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  const fetchProgress = async (uid: string) => {
    const { data } = await (supabase as any).from(TABLES.OPERATION_TRAINING_PROGRESS).select('*').eq('user_id', uid);
    if (data) setProgress(data);
  };

  const viewCourse = async (course: any) => {
    setSelectedCourse(course);
    setLoading(true);

    // Trial mode: use mock materials
    if (isTrialMode()) {
      setMaterials(mockTrainingMaterials[course.id] || []);
      setLoading(false);
      return;
    }

    const { data } = await (supabase as any).from(TABLES.OPERATION_TRAINING_MATERIALS)
      .select('*')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true });
    
    if (data) setMaterials(data);
    setLoading(false);
  };

  const markCourseCompleted = async (courseId: string) => {
    if (!userId) return;
    try {
      // First try to select
      const { data: existing } = await (supabase as any).from(TABLES.OPERATION_TRAINING_PROGRESS)
        .select('*').eq('course_id', courseId).eq('user_id', userId).maybeSingle();
      
      if (existing) {
        await (supabase as any).from(TABLES.OPERATION_TRAINING_PROGRESS)
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await (supabase as any).from(TABLES.OPERATION_TRAINING_PROGRESS)
          .insert({
            course_id: courseId,
            user_id: userId,
            status: 'completed',
            completed_at: new Date().toISOString()
          });
      }
      // Refresh progress
      fetchProgress(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircleIcon className="w-5 h-5" />;
      case 'document': return <DocumentTextIcon className="w-5 h-5" />;
      case 'quiz': return <QuestionMarkCircleIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getCourseStatus = (courseId: string) => {
    const p = progress.find((x: any) => x.course_id === courseId);
    if (!p) return 'not_started';
    return p.status;
  };

  if (selectedCourse) {
    const isCompleted = getCourseStatus(selectedCourse.id) === 'completed';

    return (
      <div>
        <button onClick={() => setSelectedCourse(null)} className="text-blue-600 hover:underline mb-4 text-sm font-medium">
          &larr; Quay lại danh sách khóa học
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h1>
            {isCompleted ? (
              <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                <SolidCheckCircleIcon className="w-5 h-5 mr-1" /> Đã hoàn thành
              </span>
            ) : (
              <button 
                onClick={() => markCourseCompleted(selectedCourse.id)}
                className="flex items-center text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
              >
                <CheckCircleIcon className="w-5 h-5 mr-1" /> Đánh dấu hoàn thành
              </button>
            )}
          </div>
          <p className="text-slate-600 mb-4">{selectedCourse.description}</p>
          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
            {selectedCourse.category === 'onboarding' ? 'Hội nhập' : 'Kỹ năng'}
          </span>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-4">Nội dung học ({materials.length} bài)</h2>
        
        {loading ? (
          <div className="text-slate-500">Đang tải nội dung...</div>
        ) : materials.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
            Khóa học này chưa có nội dung.
          </div>
        ) : (
          <div className="grid gap-4">
            {materials.map((mat: any, index: number) => (
              <div key={mat.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 mr-4">
                    {getMaterialIcon(mat.material_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Bài {index + 1}: {mat.title}</h3>
                    <p className="text-sm text-slate-500">{mat.material_type === 'quiz' ? 'Trắc nghiệm' : 'Bài giảng'}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg">
                  Mở
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đào tạo & Huấn luyện</h1>
      </div>

      <div className="mb-6">
        <p className="text-slate-600">Chọn một khóa học dưới đây để bắt đầu bài học hoặc làm bài kiểm tra nghiệp vụ.</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Đang tải khóa học...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
          Chưa có khóa học nào được tạo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => {
            const status = getCourseStatus(course.id);
            return (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewCourse(course)}>
                <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                  <AcademicCapIcon className="w-12 h-12 text-slate-300" />
                  {status === 'completed' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center shadow-sm">
                      <SolidCheckCircleIcon className="w-4 h-4 mr-1" /> Hoàn thành
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                      {course.category === 'onboarding' ? 'Hội nhập' : 'Kỹ năng'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 flex-1 mb-4">{course.description}</p>
                  
                  <div className="mt-auto">
                    <button className="w-full bg-slate-50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium py-2 rounded-lg text-sm border border-slate-200 hover:border-blue-200 transition-colors">
                      Vào học
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainingPage;
