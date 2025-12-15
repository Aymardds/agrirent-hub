
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

interface Intervention {
    id: string;
    created_at: string; // Using creation date as start for now, or completed_at for history
    // ideally an intervention should have a scheduled_date
    status: string;
    priority: string;
    equipment: {
        name: string;
    };
    title: string;
}

interface InterventionCalendarProps {
    interventions: Intervention[];
}

const InterventionCalendar = ({ interventions }: InterventionCalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const getInterventionsForDay = (day: Date) => {
        return interventions.filter(i => {
            // For now, mapping intervention date to the day. 
            // In a real scheduler, we would check scheduled_date.
            // Fallback: check created_at matches the day
            const date = parseISO(i.created_at);
            return isSameDay(day, date);
        });
    };

    const statusColors: Record<string, string> = {
        pending: "bg-secondary/50 text-secondary-foreground",
        in_progress: "bg-primary/20 text-primary-foreground",
        completed: "bg-success/20 text-success-foreground",
        cancelled: "bg-destructive/10 text-destructive",
    };

    return (
        <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: fr })}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border border-border">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                    <div key={day} className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
                {daysInMonth.map((day, i) => {
                    const dayInterventions = getInterventionsForDay(day);
                    return (
                        <div key={day.toISOString()} className="bg-card min-h-[100px] p-2 border-t border-border">
                            <div className="text-right text-sm text-muted-foreground mb-2">
                                {format(day, "d")}
                            </div>
                            <div className="space-y-1">
                                {dayInterventions.map(inv => (
                                    <HoverCard key={inv.id}>
                                        <HoverCardTrigger asChild>
                                            <div className={`text-xs p-1 rounded cursor-pointer truncate ${statusColors[inv.status] || 'bg-gray-100'}`}>
                                                {inv.equipment.name}
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-semibold">{inv.title}</h4>
                                                    <Badge variant="outline" className="text-[10px]">{inv.priority}</Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground space-y-1">
                                                    <p className="flex items-center gap-2">
                                                        <Wrench className="w-3 h-3" />
                                                        {inv.equipment.name}
                                                    </p>
                                                    <p className="capitalize">Statut: {inv.status === 'in_progress' ? 'En cours' : inv.status === 'pending' ? 'En attente' : inv.status}</p>
                                                    <p>Date: {format(parseISO(inv.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InterventionCalendar;
