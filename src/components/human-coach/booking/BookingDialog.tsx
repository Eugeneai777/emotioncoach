import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ServiceSelector } from "./ServiceSelector";
import { DateTimeSelector } from "./DateTimeSelector";
import { BookingForm } from "./BookingForm";
import { BookingConfirmation } from "./BookingConfirmation";
import { AppointmentPayDialog } from "./AppointmentPayDialog";
import { HumanCoach, CoachService, CoachTimeSlot } from "@/hooks/useHumanCoaches";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: HumanCoach;
  services: CoachService[];
  initialService?: CoachService;
}

const STEPS = [
  { id: 1, title: "选择服务" },
  { id: 2, title: "选择时间" },
  { id: 3, title: "填写留言" },
  { id: 4, title: "确认预约" },
];

export function BookingDialog({ 
  open, 
  onOpenChange, 
  coach, 
  services,
  initialService 
}: BookingDialogProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<CoachService | null>(initialService || null);
  const [selectedSlot, setSelectedSlot] = useState<CoachTimeSlot | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const resetState = () => {
    setCurrentStep(1);
    setSelectedService(initialService || null);
    setSelectedSlot(null);
    setUserNotes("");
    setShowPayDialog(false);
    setCreatedOrderId(null);
    setAppointmentId(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedSlot !== null;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    if (currentStep === 4) {
      // Create order and show payment dialog
      if (!user) {
        toast.error("请先登录");
        return;
      }
      setShowPayDialog(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    toast.success("预约成功！我们会发送确认通知给您");
    handleClose();
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <>
      <Dialog open={open && !showPayDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>预约咨询 - {coach.name}</DialogTitle>
          </DialogHeader>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              {STEPS.map((step) => (
                <span
                  key={step.id}
                  className={`${
                    step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step content */}
          <div className="py-4">
            {currentStep === 1 && (
              <ServiceSelector
                services={services}
                selectedService={selectedService}
                onSelect={setSelectedService}
              />
            )}
            {currentStep === 2 && selectedService && (
              <DateTimeSelector
                coachId={coach.id}
                advanceBookingDays={selectedService.advance_booking_days || 1}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}
            {currentStep === 3 && (
              <BookingForm
                userNotes={userNotes}
                onNotesChange={setUserNotes}
              />
            )}
            {currentStep === 4 && selectedService && selectedSlot && (
              <BookingConfirmation
                coach={coach}
                service={selectedService}
                slot={selectedSlot}
                userNotes={userNotes}
              />
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === 4 ? "确认支付" : "下一步"}
              {currentStep !== 4 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showPayDialog && selectedService && selectedSlot && (
        <AppointmentPayDialog
          open={showPayDialog}
          onOpenChange={setShowPayDialog}
          coach={coach}
          service={selectedService}
          slot={selectedSlot}
          userNotes={userNotes}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
