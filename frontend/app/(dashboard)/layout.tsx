'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Divider, Avatar, Menu, MenuItem,
  useMediaQuery, Tooltip, Collapse,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { MENU_MODULOS } from '@/lib/menu';

const DRAWER_WIDTH = 260;

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  px: 2,
}));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const toggleDrawer = () => setOpen(!open);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleClose();
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: '#0d47a1' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
            SGC-Trazabilidad
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Perfil del usuario">
            <IconButton onClick={handleMenu} size="small" sx={{ ml: 2 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#1b5e20' }}>
                {(session?.user?.name || 'A').charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem disabled>
              <Typography variant="body2">
                {session?.user?.name || 'Usuario'} <br />
                <Typography component="span" variant="caption" color="text.secondary">
                  {session?.user?.email}
                </Typography>
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={toggleDrawer}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 0 },
        }}
      >
        <Toolbar>
          <LogoBox>
            <Box sx={{ fontSize: 30 }}>🏛</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.1 }}>
                Poder Judicial
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Gestión de Calidad
              </Typography>
            </Box>
          </LogoBox>
        </Toolbar>
        <Divider />
        <List component="nav" sx={{ px: 1 }}>
          {MENU_MODULOS.map((item) => {
            const active = pathname === item.ruta;
            return (
              <ListItem key={item.ruta} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={() => { router.push(item.ruta); if (isMobile) setOpen(false); }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    minHeight: 44,
                    justifyContent: 'initial',
                    bgcolor: active ? 'rgba(13, 71, 161, 0.12)' : 'transparent',
                    color: active ? '#0d47a1' : 'inherit',
                    fontWeight: active ? 'bold' : 'normal',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? '#0d47a1' : 'inherit' }}>
                    <Box component="span" sx={{ fontSize: 20 }}>{item.icono}</Box>
                  </ListItemIcon>
                  <ListItemText primary={item.titulo} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f7fa', minHeight: '100vh', pt: 10 }}>
        {children}
      </Box>
    </Box>
  );
}
