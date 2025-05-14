import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

export interface TypePersonalBlogFields {
	title?: EntryFieldTypes.Symbol;
	slug?: EntryFieldTypes.Symbol;
	date: EntryFieldTypes.Date;
	body?: EntryFieldTypes.RichText;
}

export type TypePersonalBlogSkeleton = EntrySkeletonType<TypePersonalBlogFields, "personalBlog">;
export type TypePersonalBlog<Modifiers extends ChainModifiers, Locales extends LocaleCode> = Entry<TypePersonalBlogSkeleton, Modifiers, Locales>;