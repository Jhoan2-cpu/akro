<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $currentShift = $this->currentShiftFor($user);
        $recentShifts = $user->shifts()
            ->latest('clock_in_at')
            ->limit(6)
            ->get()
            ->map(fn (Shift $shift): array => $this->formatShift($shift, true));

        $todayQuery = $user->shifts()->whereDate('clock_in_at', today());

        $todayCompletedShifts = (clone $todayQuery)
            ->whereNotNull('clock_out_at')
            ->get();

        $todayWorkedMinutes = $todayCompletedShifts->sum(function (Shift $shift): int {
            return (int) $shift->clock_in_at->diffInMinutes($shift->clock_out_at);
        });

        if ($currentShift !== null) {
            $todayWorkedMinutes += (int) $currentShift->clock_in_at->diffInMinutes(now());
        }

        $lastCompletedShift = $user->shifts()
            ->whereNotNull('clock_out_at')
            ->latest('clock_out_at')
            ->first();

        return Inertia::render('shifts/index', [
            'currentShift' => $currentShift ? $this->formatShift($currentShift) : null,
            'recentShifts' => $recentShifts,
            'stats' => [
                'todayEntries' => $todayQuery->count(),
                'todayWorkedMinutes' => $todayWorkedMinutes,
                'openShift' => $currentShift !== null,
                'totalShifts' => $user->shifts()->count(),
                'lastCompletedAt' => $lastCompletedShift?->clock_out_at?->toIso8601String(),
            ],
        ]);
    }

    public function clockIn(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($this->currentShiftFor($user) !== null) {
            throw ValidationException::withMessages([
                'shift' => 'Ya tienes un turno activo. Debes registrar la salida antes de iniciar otro.',
            ]);
        }

        Shift::query()->create([
            'user_id' => $user->id,
            'clock_in_at' => now(),
            'clock_out_at' => null,
        ]);

        return to_route('shifts.index')->with('toast', [
            'type' => 'success',
            'message' => 'Entrada de turno registrada correctamente.',
        ]);
    }

    public function clockOut(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $currentShift = $this->currentShiftFor($user);

        if ($currentShift === null) {
            throw ValidationException::withMessages([
                'shift' => 'No tienes un turno activo para registrar la salida.',
            ]);
        }

        $currentShift->update([
            'clock_out_at' => now(),
        ]);

        $durationMinutes = (int) $currentShift->clock_in_at->diffInMinutes($currentShift->clock_out_at);

        return to_route('shifts.index')->with('toast', [
            'type' => 'success',
            'message' => sprintf('Salida de turno registrada. Duración: %s.', $this->formatDuration($durationMinutes)),
        ]);
    }

    protected function currentShiftFor(User $user): ?Shift
    {
        return $user->shifts()
            ->whereNull('clock_out_at')
            ->latest('clock_in_at')
            ->first();
    }

    protected function formatShift(Shift $shift, bool $includeUser = false): array
    {
        $clockOutAt = $shift->clock_out_at;
        $durationMinutes = (int) $shift->clock_in_at->diffInMinutes($clockOutAt ?? now());

        $payload = [
            'id' => $shift->id,
            'clock_in_at' => $shift->clock_in_at->toIso8601String(),
            'clock_out_at' => $clockOutAt?->toIso8601String(),
            'clock_in_label' => $shift->clock_in_at->format('d/m/Y H:i'),
            'clock_out_label' => $clockOutAt?->format('H:i'),
            'duration_minutes' => $durationMinutes,
            'duration_label' => $this->formatDuration($durationMinutes),
            'status' => $clockOutAt === null ? 'open' : 'closed',
        ];

        if ($includeUser) {
            $payload['user_name'] = $shift->user?->name;
        }

        return $payload;
    }

    protected function formatDuration(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        return sprintf('%02dh %02dm', $hours, $remainingMinutes);
    }
}