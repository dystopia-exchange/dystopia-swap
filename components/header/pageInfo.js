import React from 'react'
import classes from './header.module.css'
import { useAppThemeContext } from "../../ui/AppThemeProvider";

const img1 = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.6694 6.276L4.93144 12.014L3.98877 11.0713L9.7261 5.33333H4.66944V4H12.0028V11.3333H10.6694V6.276Z" fill="#5688A5" />
    </svg>
)

const img1_1 = (
    <svg svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" >
        <path d="M10.6694 6.276L4.93144 12.014L3.98877 11.0713L9.7261 5.33333H4.66944V4H12.0028V11.3333H10.6694V6.276Z" fill="#5688A5" />
    </svg >
)

const img2 = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.3335 8.66667H5.3335V14H1.3335V8.66667ZM6.00016 2H10.0002V14H6.00016V2ZM10.6668 5.33333H14.6668V14H10.6668V5.33333Z" fill="#0B5E8E" />
    </svg>
)

const img2_1 = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.3335 8.66667H5.3335V14H1.3335V8.66667ZM6.00016 2H10.0002V14H6.00016V2ZM10.6668 5.33333H14.6668V14H10.6668V5.33333Z" fill="#4CADE6" />
    </svg>
)

export const PageInfo = () => {
    const { appTheme } = useAppThemeContext();
    const isDark = appTheme === 'dark'
    return (
        <a
            href="https://docs.cone.exchange"
            target="_blank"
            className={[classes.headerPageInfo].join(' ')}
        >
            <span>
                {isDark ? img1_1 : img1}
            </span>
            <span>
                {isDark ? img2_1 : img2}
            </span>
        </a>
    )
}