import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";

interface CourseRecommendation {
  id: string;
  title: string;
  video_url: string;
  reason: string;
  match_score: number;
  category?: string;
  description?: string;
}

interface MamaCourseRecommendationProps {
  recommendations: CourseRecommendation[];
  onClose?: () => void;
}

const MamaCourseRecommendation = ({ recommendations, onClose }: MamaCourseRecommendationProps) => {
  const navigate = useNavigate();

  if (!recommendations || recommendations.length === 0) return null;

  const display = recommendations.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-[#FFF3EB] rounded-2xl p-4 border border-[#F5E6D3]/60 mx-1 space-y-3"
    >
      <p className="text-xs text-[#A89580]">🎬 为你推荐相关课程</p>

      <div className="space-y-2">
        {display.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl p-3 border border-[#F5E6D3]/40"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#3D3028] line-clamp-1 flex-1 mr-2">
                {course.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F4845F]/10 text-[#F4845F] whitespace-nowrap">
                匹配{course.match_score}%
              </span>
            </div>
            <p className="text-[11px] text-[#8B7355] line-clamp-2 mb-2">
              💡 {course.reason}
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                onClose?.();
                navigate(`/courses`);
              }}
              className="w-full py-2 rounded-lg bg-[#F4845F] text-white text-xs font-medium flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3" />
              观看课程
            </motion.button>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          onClose?.();
          navigate("/courses");
        }}
        className="w-full py-2 rounded-xl text-[#F4845F] text-xs font-medium flex items-center justify-center gap-1 border border-[#F4845F]/20 bg-white"
      >
        查看更多课程 <ArrowRight className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
};

export default MamaCourseRecommendation;
