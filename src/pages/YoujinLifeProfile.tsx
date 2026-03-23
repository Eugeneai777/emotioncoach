import { YoujinBottomNav } from "@/components/youjin-life/YoujinBottomNav";

export default function YoujinLifeProfile() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="pt-12 pb-6 px-6">
        <h1 className="text-2xl font-bold text-gray-900">我的</h1>
        <p className="mt-1 text-sm text-gray-400">用户中心即将上线</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-5xl mb-4">👤</span>
        <p className="text-gray-500">个人中心开发中...</p>
      </div>
      <YoujinBottomNav active="profile" />
    </div>
  );
}
