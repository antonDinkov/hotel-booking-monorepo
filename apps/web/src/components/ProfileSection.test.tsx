import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileSection from "./ProfileSection";

describe("ProfileSection", () => {
    it("renders the provided title and children", () => {
        render(
            <ProfileSection title="Personal">
                <div>Child content</div>
            </ProfileSection>
        );

        expect(screen.getByText("Personal")).toBeInTheDocument();
        expect(screen.getByText("Child content")).toBeInTheDocument();
    });
});
