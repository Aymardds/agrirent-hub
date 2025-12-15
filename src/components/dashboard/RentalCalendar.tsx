
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface Rental {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    equipment: {
        name: string;
    };
    renter?: {
        full_name: string;
    };
}

interface RentalCalendarProps {
    rentals: Rental[];
}

const RentalCalendar = ({ rentals }: RentalCalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const getRentalsForDay = (day: Date) => {
        return rentals.filter(rental => {
            if (rental.status === 'cancelled') return false;
            const start = parseISO(rental.start_date);
            const end = parseISO(rental.end_date);
            return isWithinInterval(day, { start, end });
        });
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
                    const dayRentals = getRentalsForDay(day);
                    return (
                        <div key={day.toISOString()} className="bg-card min-h-[100px] p-2 border-t border-border">
                            <div className="text-right text-sm text-muted-foreground mb-2">
                                {format(day, "d")}
                            </div>
                            <div className="space-y-1">
                                {dayRentals.map(rental => (
                                    <HoverCard key={rental.id}>
                                        <HoverCardTrigger asChild>
                                            <div className={`text-xs p-1 rounded cursor-pointer truncate ${rental.status === 'pending' ? 'bg-warning/20 text-warning-foreground' :
                                                    rental.status === 'active' ? 'bg-success/20 text-success-foreground' :
                                                        'bg-primary/20 text-primary-foreground'
                                                }`}>
                                                {rental.equipment.name}
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-semibold">{rental.equipment.name}</h4>
                                                <div className="text-xs text-muted-foreground">
                                                    <p>Locataire: {rental.renter?.full_name || 'N/A'}</p>
                                                    <p>Du: {rental.start_date}</p>
                                                    <p>Au: {rental.end_date}</p>
                                                    <p className="capitalize">Statut: {rental.status}</p>
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

export default RentalCalendar;
