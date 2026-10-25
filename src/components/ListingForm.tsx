"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { pushToast } from "../store/useUiStore";
import { Icon } from "./Icon";

const listingSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(120),
  description: z.string().trim().min(20, "Tell guests a little more about the place").max(10_000),
  propertyType: z.string().min(2),
  roomType: z.string().min(2),
  address: z.string().trim().min(3),
  city: z.string().trim().min(2),
  country: z.string().trim().min(2),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  pricePerNight: z.coerce.number().int().positive(),
  maxGuests: z.coerce.number().int().positive().max(100),
  bedrooms: z.coerce.number().int().positive().max(100),
  beds: z.coerce.number().int().positive().max(100),
  bathrooms: z.coerce.number().positive().max(100),
  imageUrl: z.string().url("Add a valid image URL").or(z.literal("")),
});

type ListingFormValues = z.input<typeof listingSchema>;

const initialValues: ListingFormValues = {
  title: "",
  description: "",
  propertyType: "Cabin",
  roomType: "Entire home",
  address: "",
  city: "",
  country: "United States",
  latitude: 0,
  longitude: 0,
  pricePerNight: 220,
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  imageUrl: "",
};

function FieldError({ message }: { message?: string }) {
  return message ? <small className="form-error">{message}</small> : null;
}

export function ListingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, trigger, setValue, formState: { errors } } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: initialValues,
  });

  async function nextStep(fields: Array<keyof ListingFormValues>, next: number) {
    if (await trigger(fields)) setStep(next);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const signatureResponse = await fetch("/api/uploads/signature", { method: "POST", credentials: "include" });
      const signature = await signatureResponse.json().catch(() => null);
      if (!signatureResponse.ok) throw new Error(signature?.error ?? "Cloudinary uploads are not configured");
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("folder", signature.folder);
      body.append("signature", signature.signature);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body });
      const upload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok || typeof upload?.secure_url !== "string") throw new Error(upload?.error?.message ?? "Image upload failed");
      setValue("imageUrl", upload.secure_url, { shouldValidate: true, shouldDirty: true });
      pushToast("Image uploaded", "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function submit(values: ListingFormValues) {
    setBusy(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          pricePerNight: Number(values.pricePerNight),
          maxGuests: Number(values.maxGuests),
          bedrooms: Number(values.bedrooms),
          beds: Number(values.beds),
          bathrooms: Number(values.bathrooms),
          cleaningFee: 0,
          serviceFee: 0,
          amenities: ["Wifi", "Kitchen"],
          images: values.imageUrl ? [{ url: values.imageUrl, alt: values.title }] : [],
          status: "DRAFT",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Could not create listing");
      pushToast("Your listing draft is saved", "success");
      router.push("/host/listings");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not create listing", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="listing-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="listing-form__progress"><span className="listing-form__step listing-form__step--active">01</span><span /><span className={step >= 2 ? "listing-form__step listing-form__step--active" : "listing-form__step"}>02</span><span /><span className={step >= 3 ? "listing-form__step listing-form__step--active" : "listing-form__step"}>03</span></div>
      {step === 1 ? <div className="listing-form__section">
        <p className="eyebrow">First, the basics</p><h1>Tell us about your place.</h1><p className="page-lede">A few details help guests picture their stay.</p>
        <label className="form-field"><span>Listing title</span><input {...register("title")} placeholder="A-frame cabin beside the lake" /><FieldError message={errors.title?.message} /></label>
        <label className="form-field"><span>Description</span><textarea {...register("description")} placeholder="What makes this place special?" rows={5} /><FieldError message={errors.description?.message} /></label>
        <div className="form-grid"><label className="form-field"><span>Property type</span><select {...register("propertyType")}><option>Cabin</option><option>House</option><option>Apartment</option><option>Villa</option><option>Guesthouse</option></select></label><label className="form-field"><span>Room type</span><select {...register("roomType")}><option>Entire home</option><option>Private room</option><option>Shared room</option></select></label></div>
        <button type="button" className="button button--dark" onClick={() => nextStep(["title", "description", "propertyType", "roomType"], 2)}>Next: location <Icon name="arrow-right" size={16} /></button>
      </div> : null}
      {step === 2 ? <div className="listing-form__section">
        <p className="eyebrow">Set the scene</p><h1>Where will guests find you?</h1><p className="page-lede">Use the address guests will recognize when they arrive. Coordinates power the map preview.</p>
        <label className="form-field"><span>Street address</span><input {...register("address")} placeholder="123 Valencia Street" /><FieldError message={errors.address?.message} /></label>
        <div className="form-grid"><label className="form-field"><span>City</span><input {...register("city")} placeholder="San Francisco" /><FieldError message={errors.city?.message} /></label><label className="form-field"><span>Country</span><input {...register("country")} placeholder="United States" /><FieldError message={errors.country?.message} /></label></div>
        <div className="form-grid"><label className="form-field"><span>Latitude</span><input {...register("latitude")} inputMode="decimal" placeholder="37.7749" /><FieldError message={errors.latitude?.message} /></label><label className="form-field"><span>Longitude</span><input {...register("longitude")} inputMode="decimal" placeholder="-122.4194" /><FieldError message={errors.longitude?.message} /></label></div>
        <div className="listing-form__actions"><button type="button" className="button button--outline" onClick={() => setStep(1)}>Back</button><button type="button" className="button button--dark" onClick={() => nextStep(["address", "city", "country", "latitude", "longitude"], 3)}>Next: details <Icon name="arrow-right" size={16} /></button></div>
      </div> : null}
      {step === 3 ? <div className="listing-form__section">
        <p className="eyebrow">Make it bookable</p><h1>Set the details guests need.</h1><p className="page-lede">You can refine amenities, fees, and availability after saving this draft.</p>
        <div className="form-grid"><label className="form-field"><span>Price per night (USD)</span><input {...register("pricePerNight")} type="number" min="1" placeholder="220" /><FieldError message={errors.pricePerNight?.message} /></label><label className="form-field"><span>Maximum guests</span><input {...register("maxGuests")} type="number" min="1" placeholder="4" /><FieldError message={errors.maxGuests?.message} /></label></div>
        <div className="form-grid"><label className="form-field"><span>Bedrooms</span><input {...register("bedrooms")} type="number" min="1" /><FieldError message={errors.bedrooms?.message} /></label><label className="form-field"><span>Beds</span><input {...register("beds")} type="number" min="1" /></label><label className="form-field"><span>Bathrooms</span><input {...register("bathrooms")} type="number" min="1" step="0.5" /></label></div>
        <label className="form-field"><span>Cover image URL</span><input {...register("imageUrl")} placeholder="https://…" /><FieldError message={errors.imageUrl?.message} /></label>
        <label className="form-field"><span>Or upload directly to Cloudinary</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} />{uploading ? <small>Uploading securely…</small> : null}</label>
        <div className="listing-form__actions"><button type="button" className="button button--outline" onClick={() => setStep(2)}>Back</button><button type="submit" className="button button--accent" disabled={busy || uploading}>{busy ? <><span className="spinner spinner--light" /> Saving…</> : "Save listing draft"}</button></div>
      </div> : null}
    </form>
  );
}
