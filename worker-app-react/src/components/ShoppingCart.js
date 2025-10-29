import React, { useState } from 'react';
import { Fab, Badge, Drawer, Box, Typography, List, ListItem, ListItemText, IconButton, Divider, Button } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ShoppingCart = ({ cart, onUpdateCart, onNext }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdate = (product, quantity) => {
    const newQuantity = Math.max(0, quantity);
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    if (newQuantity === 0) {
      newCart = cart.filter(item => item.id !== product.id);
    } else if (existingItem) {
      newCart = cart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
    } else {
      newCart = [...cart, { ...product, quantity: newQuantity }];
    }
    onUpdateCart(newCart);
  };

  const cartContent = (
    <Box sx={{ width: { xs: '90vw', sm: 350 }, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">購物車</Typography>
        <IconButton onClick={() => setIsDrawerOpen(false)}><CloseIcon /></IconButton>
      </Box>
      <Divider sx={{ my: 1 }} />
      {cart.length === 0 ? (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">購物車是空的</Typography>
        </Box>
      ) : (
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {cart.map((item) => (
            <ListItem key={item.id} secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={() => handleUpdate(item, item.quantity - 1)}><RemoveCircleOutlineIcon fontSize="small" /></IconButton>
                <Typography sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</Typography>
                <IconButton size="small" onClick={() => handleUpdate(item, item.quantity + 1)}><AddCircleOutlineIcon fontSize="small" /></IconButton>
              </Box>
            }>
              <ListItemText primary={item.subcategory} secondary={`${item.size} (${item.unit})`} />
            </ListItem>
          ))}
        </List>
      )}
      <Divider sx={{ my: 1 }} />
      <Button 
        variant="contained" 
        fullWidth 
        size="large"
        endIcon={<ArrowForwardIcon />}
        onClick={() => { setIsDrawerOpen(false); onNext(); }} 
        disabled={cart.length === 0}
      >
        預覽請購單
      </Button>
    </Box>
  );

  return (
    <>
      <Fab
        variant="extended"
        color="secondary"
        onClick={() => setIsDrawerOpen(true)}
        sx={{ position: 'fixed', bottom: 30, right: 30 }}
      >
        <Badge badgeContent={totalItems} color="error">
          <ShoppingCartIcon />
        </Badge>
        <Typography sx={{ ml: 1.5, display: { xs: 'none', sm: 'block' } }}>購物車</Typography>
      </Fab>
      <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        {cartContent}
      </Drawer>
    </>
  );
};

export default ShoppingCart;