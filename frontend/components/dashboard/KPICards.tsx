import { Grid, Card, CardContent, Typography, Box } from '@mui/material';

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
      case 'bueno': return '#3b82f6';
      case 'regular': return '#eab308';
      case 'critico': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Grid container spacing={3}>
      {kpis.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ borderRadius: 2, borderLeft: `4px solid ${getColor(kpi.estado)}` }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" uppercase>
                {kpi.nombre}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold">
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