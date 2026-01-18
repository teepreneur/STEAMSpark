import { Metadata } from 'next'
import TeacherEarlyAccessClient from './client-page'

export const metadata: Metadata = {
    title: 'Early Access for STEAM Educators | STEAM Spark',
    description: 'Join Ghana\'s first platform built for STEAM educators. Own your program, set your rates, and get paid on time. Secure your early access spot today.',
    keywords: [
        'STEAM teacher jobs Ghana',
        'Teach coding for kids Ghana',
        'Robotics instructor jobs Accra',
        'Online tutoring platform Ghana',
        'STEAM education careers',
        'Early access program for educators',
        'STEAM Spark teacher sign up'
    ],
    openGraph: {
        title: 'Own Your STEAM Story | Teacher Early Access',
        description: 'Join the top 50 pioneering educators shaping the future of STEAM in Ghana. Create your own programs and earn on your terms.',
        url: 'https://steamsparkgh.com/earlyaccess/teachers',
        siteName: 'STEAM Spark',
        locale: 'en_GH',
        type: 'website',
        images: [
            {
                url: 'https://steamsparkgh.com/marketing-assets/campaign-launch.png',
                width: 1080,
                height: 1080,
                alt: 'Own Your STEAM Story - STEAM Spark',
            }
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Own Your STEAM Story | Teacher Early Access',
        description: 'Join the top 50 pioneering educators shaping the future of STEAM in Ghana.',
        images: ['https://steamsparkgh.com/marketing-assets/campaign-launch.png'],
    },
    alternates: {
        canonical: 'https://steamsparkgh.com/earlyaccess/teachers',
    }
}

export default function TeacherEarlyAccessPage() {
    return <TeacherEarlyAccessClient />
}
