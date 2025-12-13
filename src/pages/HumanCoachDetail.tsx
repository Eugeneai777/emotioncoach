import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Users, Award, CheckCircle, MapPin, GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachBadge } from "@/components/human-coach/CoachBadge";
import { CoachRatingDisplay, MultiDimensionRating } from "@/components/human-coach/CoachRatingDisplay";
import { ReviewCard } from "@/components/human-coach/ReviewCard";
import { BookingDialog } from "@/components/human-coach/booking/BookingDialog";
import { 
  useHumanCoach, 
  useCoachServices, 
  useCoachCertifications,
  useCoachReviews,
  CoachService
} from "@/hooks/useHumanCoaches";

export default function HumanCoachDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("intro");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<CoachService | undefined>();
  
  const { data: coach, isLoading: loadingCoach } = useHumanCoach(id);
  const { data: services = [] } = useCoachServices(id);
  const { data: certifications = [] } = useCoachCertifications(id);
  const { data: reviews = [] } = useCoachReviews(id);
  
  if (loadingCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
        <Skeleton className="h-64 rounded-xl mb-4" />
        <Skeleton className="h-32 rounded-xl mb-4" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }
  
  if (!coach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium">教练不存在</h2>
          <Button className="mt-4" onClick={() => navigate("/human-coaches")}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }
  
  const lowestPrice = services.length > 0 
    ? Math.min(...services.map(s => Number(s.price)))
    : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">教练详情</h1>
          <div className="w-10" />
        </div>
      </header>
      
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* 教练基本信息卡片 */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-20" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row gap-4 -mt-10">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={coach.avatar_url || undefined} alt={coach.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                  {coach.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pt-2 sm:pt-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{coach.name}</h2>
                  <CoachBadge badgeType={coach.badge_type} size="sm" />
                  {coach.is_verified && (
                    <Badge variant="outline" className="text-teal-600 border-teal-200 bg-teal-50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      已认证
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{coach.title}</p>
                
                <div className="mt-3">
                  <CoachRatingDisplay 
                    rating={Number(coach.rating)} 
                    totalReviews={coach.total_reviews}
                  />
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {coach.specialties?.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{coach.experience_years}</div>
                <div className="text-xs text-muted-foreground">年经验</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{coach.total_sessions}</div>
                <div className="text-xs text-muted-foreground">次咨询</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{Number(coach.positive_rate).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">好评率</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tab 内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="intro">个人简介</TabsTrigger>
            <TabsTrigger value="services">服务项目</TabsTrigger>
            <TabsTrigger value="reviews">用户评价 ({reviews.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="intro" className="space-y-4 mt-4">
            {/* 简介 */}
            {coach.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">关于我</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {coach.bio}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* 教育背景 */}
            {coach.education && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    教育背景
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {coach.education}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* 资质认证 */}
            {certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    资质认证
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-teal-500" />
                      <div>
                        <div className="font-medium text-sm">{cert.cert_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {cert.issuing_authority}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {/* 多维度评分 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">详细评分</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiDimensionRating
                  professionalism={Number(coach.rating_professionalism)}
                  communication={Number(coach.rating_communication)}
                  helpfulness={Number(coach.rating_helpfulness)}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4 mt-4">
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂无可预约的服务项目
                </CardContent>
              </Card>
            ) : (
              services.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{service.service_name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration_minutes}分钟
                          </span>
                          <span>需提前{service.advance_booking_days}天预约</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-teal-600">
                          ¥{Number(service.price).toFixed(0)}
                        </div>
                        <Button 
                          size="sm" 
                          className="mt-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                        >
                          立即预约
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4 mt-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂无用户评价
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 底部预约按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-4">
        <div className="container max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {lowestPrice !== null && (
              <>
                <span className="text-sm text-muted-foreground">起</span>
                <span className="text-2xl font-bold text-teal-600 ml-1">
                  ¥{lowestPrice}
                </span>
              </>
            )}
          </div>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 px-8"
            disabled={services.length === 0}
            onClick={() => {
              setSelectedService(undefined);
              setBookingOpen(true);
            }}
          >
            立即预约
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      {coach && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          coach={coach}
          services={services}
          initialService={selectedService}
        />
      )}
    </div>
  );
}
