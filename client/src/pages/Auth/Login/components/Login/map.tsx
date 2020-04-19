import { LockOutlined, MailOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons'
import React from 'react'
import styles from './index.less'

export default {
	UserName: {
		props: {
			size: 'default',
			id: 'userName',
			prefix: <UserOutlined className={styles.prefixIcon} />,
			placeholder: 'admin',
		},
		rules: [
			{
				required: true,
				message: 'Please enter username!',
			},
		],
	},
	Password: {
		props: {
			size: 'default',
			prefix: <LockOutlined className={styles.prefixIcon} />,
			type: 'password',
			id: 'password',
			placeholder: '888888',
		},
		rules: [
			{
				required: true,
				message: 'Please enter password!',
			},
		],
	},
	Mobile: {
		props: {
			size: 'large',
			prefix: <MobileOutlined className={styles.prefixIcon} />,
			placeholder: 'mobile number',
		},
		rules: [
			{
				required: true,
				message: 'Please enter mobile number!',
			},
			{
				pattern: /^1\d{10}$/,
				message: 'Wrong mobile number format!',
			},
		],
	},
	Captcha: {
		props: {
			size: 'large',
			prefix: <MailOutlined className={styles.prefixIcon} />,
			placeholder: 'captcha',
		},
		rules: [
			{
				required: true,
				message: 'Please enter Captcha!',
			},
		],
	},
}