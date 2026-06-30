#!/usr/bin/env bash
# Bootstrap the manggaleh schema for the Kuya Bong app (project: realief-expert, env: dev).
#
# RUN THIS YOURSELF (it needs your manggaleh OWNER account, not the service key):
#   npx mg login --url https://api.manggaleh.com
#   bash scripts/manggaleh/setup.sh
#
# Re-running is safe-ish: `collections create` will error on existing names; that's fine.
# Column modifiers: ! = NOT NULL, ^ = UNIQUE. manggaleh auto-adds id/created_at/created_by/updated_at/updated_by.
set -u
P="--project realief-expert --env dev --url https://api.manggaleh.com"
mg() { npx --yes mg "$@"; }

echo "== user-owned collections (per-user RLS via --owner-column) =="
# NOTE: --owner-column auto-creates that column, so it must NOT be repeated in --columns.

mg collections create $P --name patient_profiles --owner-column user_id \
  --columns "date_of_birth:text,gender:text,address:text,emergency_contact:text,family_group_id:text,active:boolean"

mg collections create $P --name appointments --owner-column patient_user_id \
  --columns "clinic_id:uuid!,service_type_id:uuid!,therapist_id:uuid!,date:text!,start:text!,end:text!,for_member_id:text,for_member_name:text,status:text!,source:text,note:text,cancelled_by:text,cancellation_reason_id:uuid,cancellation_note:text"

mg collections create $P --name patient_packages --owner-column owner_user_id \
  --columns "definition_id:uuid,name:text!,total_sessions:integer!,remaining:integer!,assign_date:text!,expiry_date:text!,status:text!,source_package_id:uuid,transferred_from_user_id:text"

mg collections create $P --name product_purchases --owner-column patient_user_id \
  --columns "product_id:uuid,product_name:text,unit_price_at_sale:numeric,quantity:integer,purchase_date:text!,estimated_follow_up_date:text,follow_up_status:text,notes:text"

mg collections create $P --name friends --owner-column requester_user_id \
  --columns "addressee_user_id:text!,status:text!"

echo "== shared/admin collections (read via service-key Functions; no public read in manggaleh) =="

mg collections create $P --name clinics \
  --columns "name:text!,address:text,contact:text,active:boolean"

mg collections create $P --name service_types \
  --columns "name:text!,duration_minutes:integer!,active:boolean,notes:text"

mg collections create $P --name therapists \
  --columns "name:text!,active:boolean,user_id:uuid"

mg collections create $P --name therapist_availability \
  --columns "therapist_id:uuid!,clinic_id:uuid!,date:text!,start:text!,end:text!"

mg collections create $P --name package_definitions \
  --columns "name:text!,sessions:integer!,validity_days:integer!"

mg collections create $P --name package_usage \
  --columns "patient_package_id:uuid!,appointment_id:uuid,member_name:text,date:text!,recorded_by:text"

mg collections create $P --name products \
  --columns "name:text!,category:text,price:numeric!,active:boolean,notes:text,image_object_ids:jsonb"

mg collections create $P --name announcements \
  --columns "title:text!,message:text!,expiry_date:text!,published:boolean"

mg collections create $P --name cancellation_reasons \
  --columns "label:text!,active:boolean"

mg collections create $P --name credit_transfers \
  --columns "from_user_id:text!,to_user_id:text!,sessions:integer!,original_package_id:uuid,recipient_package_id:uuid,expiry_date:text,reversed:boolean"

mg collections create $P --name audit_log \
  --columns "actor_user_id:text,actor_name:text,action:text!,detail:text,at:timestamptz!"

mg collections create $P --name sub_admin_permissions \
  --columns "key:text^,manage_booking:boolean,appointment_management:boolean,manage_clinics:boolean,manage_therapists:boolean,manage_patients:boolean,manage_products:boolean,manage_services:boolean,manage_cancellation_reasons:boolean,manage_announcements:boolean,manage_follow_up:boolean,reports_services:boolean,reports_products:boolean"

mg collections create $P --name app_users --owner-column user_id \
  --columns "name:text!,email:text!,role:text!,admin_level:text,active:boolean"

mg collections create $P --name family_members --owner-column owner_user_id \
  --columns "name:text!,relationship:text,is_child:boolean,linked_user_id:text,parent_user_id:text,status:text!,family_group_id:text"

echo "== done. verify: mg collections list $P =="
