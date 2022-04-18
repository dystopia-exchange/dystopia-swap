import { useTheme, withTheme } from '@mui/styles';
import { Box, IconButton } from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material';
import React from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function TablePaginationActions(props) {
  const theme = useTheme();
  const {count, page, rowsPerPage, onPageChange} = props;
  const {appTheme} = useAppThemeContext();

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{flexShrink: 0, ml: 2.5}}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
        style={{
          width: 30,
          height: 30,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl' ? <KeyboardDoubleArrowRight/> : <KeyboardDoubleArrowLeft/>}
      </IconButton>

      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        style={{
          width: 30,
          height: 30,
          marginLeft: 10,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl' ? <KeyboardArrowRight/> : <KeyboardArrowLeft/>}
      </IconButton>

      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        style={{
          width: 30,
          height: 30,
          marginLeft: 10,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl' ? <KeyboardArrowLeft/> : <KeyboardArrowRight/>}
      </IconButton>

      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
        style={{
          width: 30,
          height: 30,
          marginLeft: 10,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl' ? <KeyboardDoubleArrowLeft/> : <KeyboardDoubleArrowRight/>}
      </IconButton>
    </Box>
  );
}

export default withTheme(TablePaginationActions);
