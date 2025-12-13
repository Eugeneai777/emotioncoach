import { Card } from "@/components/ui/card";
import { Clock, Calendar, Check } from "lucide-react";
import { CoachService } from "@/hooks/useHumanCoaches";

interface ServiceSelectorProps {
  services: CoachService[];
  selectedService: CoachService | null;
  onSelect: (service: CoachService) => void;
}

export function ServiceSelector({ services, selectedService, onSelect }: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-foreground">选择服务</h3>
      <div className="space-y-2">
        {services.map((service) => (
          <Card
            key={service.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedService?.id === service.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onSelect(service)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{service.service_name}</h4>
                  {selectedService?.id === service.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes}分钟
                  </span>
                  {service.advance_booking_days && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      需提前{service.advance_booking_days}天预约
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-primary">¥{service.price}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
