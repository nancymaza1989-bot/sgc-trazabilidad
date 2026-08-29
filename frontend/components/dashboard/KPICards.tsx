import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { PJ_COLORS } from '@/lib/theme';

interface KPI {
  nombre: string;
  valor: number;
  unidad: string;
  objetivo: number;
  estado: string;
}

interface KPICardsProps {
  kpis: KPI[];
}

export function KPICards({ kpis }: KPICardsProps) {
  const getColor = (estado: string) => {
    switch (estado) {
      case 'excelente': return '#22c55e';
      case 'bueno': return PJ_COLORS.primary;
      case 'regular': return '#eab308';
      case 'critico': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Grid container spacing={3}>
      {kpis.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ borderRadius: 2, borderLeft: `6px solid ${getColor(kpi.estado)}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', bgcolor: PJ_COLORS.surface }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                {kpi.nombre}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: PJ_COLORS.primaryDark }}>
                  {kpi.valor}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {kpi.unidad}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Objetivo: {kpi.objetivo} {kpi.unidad}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}