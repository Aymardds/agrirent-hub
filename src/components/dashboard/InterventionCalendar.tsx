
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Wrench, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

interface Intervention {
    id: string;
    scheduled_date?: string;
    status: string;
    priority: string;
    equipment: {
        name: string;
    };
    technician?: {
        full_name: string;
    };
    title: string;
    description?: string;
}

interface InterventionCalendarProps {
    interventions: Intervention[];
    onDayClick?: (day: Date) => void;
    onInterventionClick?: (intervention: Intervention) => void;
}

const InterventionCalendar = ({
    interventions,
    onDayClick,
    onInterventionClick
}: InterventionCalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const daysInCalendar = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const getInterventionsForDay = (day: Date) => {
        return interventions.filter(i => {
            if (!i.scheduled_date) return false;
            const date = parseISO(i.scheduled_date);
            return isSameDay(day, date);
        });
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        in_progress: "bg-blue-100 text-blue-700 border-blue-200",
        completed: "bg-green-100 text-green-700 border-green-200",
        cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    const priorityColors: Record<string, string> = {
        low: "bg-gray-100 text-gray-700",
        medium: "bg-blue-100 text-blue-700",
        high: "bg-orange-100 text-orange-700",
        critical: "bg-red-100 text-red-700",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold font-display capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: fr })}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentMonth(new Date())} size="sm">
                        Aujourd'hui
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border shadow-sm">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                    <div key={day} className="bg-muted/50 p-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {day}
                    </div>
                ))}
                {daysInCalendar.map((day) => {
                    const dayInterventions = getInterventionsForDay(day);
                    const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toISOString()}
                            className={`bg-card min-h-[120px] p-2 border-t border-border transition-colors hover:bg-muted/5 ${!isCurrentMonth ? 'opacity-40 bg-muted/10' : ''}`}
                            onClick={() => onDayClick?.(day)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-medium ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full' : 'text-muted-foreground'}`}>
                                    {format(day, "d")}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {dayInterventions.map(inv => (
                                    <HoverCard key={inv.id} openDelay={200}>
                                        <HoverCardTrigger asChild>
                                            <div
                                                className={`text-[10px] p-1.5 rounded-md border cursor-pointer truncate font-medium shadow-sm transition-transform hover:scale-[1.02] ${statusColors[inv.status] || 'bg-gray-100'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onInterventionClick?.(inv);
                                                }}
                                            >
                                                {inv.scheduled_date ? format(parseISO(inv.scheduled_date), "HH:mm") : '--:--'} - {inv.equipment?.name}
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-72 p-4" side="top" align="start">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="text-sm font-bold">{inv.title}</h4>
                                                    <Badge className={`text-[9px] uppercase ${priorityColors[inv.priority]}`}>
                                                        {inv.priority}
                                                    </Badge>
                                                </div>

                                                {inv.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {inv.description}
                                                    </p>
                                                )}

                                                <div className="space-y-1.5 pt-2 border-t">
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                        <Wrench className="w-3.5 h-3.5 text-primary" />
                                                        <span className="font-semibold text-foreground">{inv.equipment?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {inv.scheduled_date ? format(parseISO(inv.scheduled_date), "HH:mm") : 'Non planifié'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                        <User className="w-3.5 h-3.5" />
                                                        {inv.technician?.full_name || "Non assigné"}
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <Badge variant="outline" className={`text-[10px] w-full justify-center ${statusColors[inv.status]}`}>
                                                        {inv.status}
                                                    </Badge>
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

            <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-200"></div> En attente
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-200"></div> En cours
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-200"></div> Terminé
                </div>
            </div>
        </div>
    );
};

export default InterventionCalendar;
