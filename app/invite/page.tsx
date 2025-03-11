import InvitationPage from "@/components/InvitationPage/InvitationPage"


const page = () => {
    return (
        <>
            <InvitationPage
                actionName="Miss Rwanda"
                actionType="Vote"
                dueDate="12 Dec 2024"
                dueTime="00:00"
                inviterName="John Doe"
                inviterEmail="john.doe@example.com"
            />
        </>
    )
}

export default page;