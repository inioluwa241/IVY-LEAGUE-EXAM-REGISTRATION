"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  residenceAddress: string;
  accaRegNo: string;
}

interface Props {
  data: PersonalDetails;
  onUpdate: (data: PersonalDetails) => void;
}

export default function PersonalDetailsSection({ data, onUpdate }: Props) {
  const handleChange = (field: keyof PersonalDetails, value: string) => {
    onUpdate({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="john@example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+234 91 391 16045"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select
            value={data.gender}
            onValueChange={(value) => handleChange("gender", value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="prefer-not-to-say">
                Prefer not to say
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accaRegNo">ACCA Reg. No.</Label>
          <Input
            id="accaRegNo"
            value={data.accaRegNo}
            onChange={(e) => handleChange("accaRegNo", e.target.value)}
            placeholder="e.g. 2456789"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="residenceAddress">Residence Address *</Label>
        <Textarea
          id="residenceAddress"
          value={data.residenceAddress}
          onChange={(e) => handleChange("residenceAddress", e.target.value)}
          placeholder="Street address, city, state, postal code"
          rows={3}
        />
      </div>

      <p className="text-sm text-muted-foreground">* Required fields</p>
    </div>
  );
}
