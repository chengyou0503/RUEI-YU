import React from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography, Box,
  Card, CardContent, IconButton, TextField, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const ProductList = ({ products, cart, onUpdateCart }) => {
  if (!products || products.length === 0) {
    return <Typography>沒有可用的品項。</Typography>;
  }

  // 1. 按 "category" 分組
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || '未分類';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const handleQuantityChange = (product, value) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity)) {
      onUpdateCart(product, quantity);
    }
  };

  return (
    <Box>
      {Object.entries(groupedProducts).map(([category, items]) => (
        <Accordion key={category} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{category}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {items.map((product) => {
                const cartItem = cart.find(item => item.id === product.id);
                const quantity = cartItem ? cartItem.quantity : 0;

                return (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body1" component="div" gutterBottom>
                          {product.subcategory}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          厚度: {product.thickness} / 尺寸: {product.size} / 單位: {product.unit}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <IconButton
                            aria-label="減少數量"
                            onClick={() => onUpdateCart(product, quantity - 1)}
                          >
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                          <TextField
                            type="number"
                            variant="outlined"
                            size="small"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(product, e.target.value)}
                            sx={{ width: '70px', textAlign: 'center' }}
                            inputProps={{ style: { textAlign: 'center' } }}
                          />
                          <IconButton
                            aria-label="增加數量"
                            onClick={() => onUpdateCart(product, quantity + 1)}
                          >
                            <AddCircleOutlineIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ProductList;