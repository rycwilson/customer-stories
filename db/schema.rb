# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170807002949) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "pg_stat_statements"

  create_table "admins", force: :cascade do |t|
    t.string   "email"
    t.string   "encrypted_password",     default: "", null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet     "current_sign_in_ip"
    t.inet     "last_sign_in_ip"
    t.string   "first_name"
    t.string   "last_name"
    t.datetime "created_at",                          null: false
    t.datetime "updated_at",                          null: false
  end

  add_index "admins", ["email"], name: "index_admins_on_email", unique: true, using: :btree

  create_table "adwords_ad_groups", force: :cascade do |t|
    t.integer  "adwords_campaign_id"
    t.integer  "ad_group_id",         limit: 8
    t.string   "name"
    t.string   "status",                        default: "PAUSED"
    t.datetime "created_at",                                       null: false
    t.datetime "updated_at",                                       null: false
  end

  add_index "adwords_ad_groups", ["adwords_campaign_id"], name: "index_adwords_ad_groups_on_adwords_campaign_id", using: :btree

  create_table "adwords_ads", force: :cascade do |t|
    t.integer  "adwords_ad_group_id"
    t.integer  "story_id"
    t.integer  "ad_id",               limit: 8
    t.string   "status",                        default: "PAUSED"
    t.string   "approval_status",               default: "UNCHECKED"
    t.string   "long_headline"
    t.datetime "created_at",                                          null: false
    t.datetime "updated_at",                                          null: false
  end

  add_index "adwords_ads", ["adwords_ad_group_id"], name: "index_adwords_ads_on_adwords_ad_group_id", using: :btree
  add_index "adwords_ads", ["story_id"], name: "index_adwords_ads_on_story_id", using: :btree

  create_table "adwords_ads_images", force: :cascade do |t|
    t.integer  "adwords_ad_id",    limit: 8
    t.integer  "adwords_image_id", limit: 8
    t.datetime "created_at",                 null: false
    t.datetime "updated_at",                 null: false
  end

  add_index "adwords_ads_images", ["adwords_ad_id"], name: "index_adwords_ads_images_on_adwords_ad_id", using: :btree
  add_index "adwords_ads_images", ["adwords_image_id"], name: "index_adwords_ads_images_on_adwords_image_id", using: :btree

  create_table "adwords_campaigns", force: :cascade do |t|
    t.integer  "company_id"
    t.integer  "campaign_id", limit: 8
    t.string   "type"
    t.string   "name"
    t.string   "status",                default: "PAUSED"
    t.datetime "created_at",                               null: false
    t.datetime "updated_at",                               null: false
  end

  add_index "adwords_campaigns", ["company_id"], name: "index_adwords_campaigns_on_company_id", using: :btree

  create_table "adwords_images", force: :cascade do |t|
    t.integer  "company_id"
    t.string   "image_url"
    t.datetime "created_at",                                null: false
    t.datetime "updated_at",                                null: false
    t.boolean  "company_default",           default: false
    t.integer  "media_id",        limit: 8
  end

  add_index "adwords_images", ["company_id"], name: "index_adwords_images_on_company_id", using: :btree

  create_table "call_to_actions", force: :cascade do |t|
    t.string   "type"
    t.integer  "company_id"
    t.string   "link_url"
    t.string   "description"
    t.text     "form_html"
    t.string   "display_text"
    t.datetime "created_at",                      null: false
    t.datetime "updated_at",                      null: false
    t.boolean  "company_primary", default: false
  end

  add_index "call_to_actions", ["company_id"], name: "index_call_to_actions_on_company_id", using: :btree

  create_table "companies", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at",                                                 null: false
    t.datetime "updated_at",                                                 null: false
    t.string   "logo_file_name"
    t.string   "logo_content_type"
    t.integer  "logo_file_size"
    t.datetime "logo_updated_at"
    t.string   "logo_url"
    t.string   "subdomain"
    t.string   "feature_flag",                           default: "beta"
    t.string   "header_color_1",                         default: "#FBFBFB"
    t.string   "header_color_2",                         default: "#85CEE6"
    t.string   "header_text_color",                      default: "#333333"
    t.string   "website"
    t.string   "gtm_id"
    t.string   "primary_cta_background_color"
    t.string   "primary_cta_text_color"
    t.string   "adwords_logo_url"
    t.string   "adwords_short_headline"
    t.boolean  "promote_tr",                             default: false
    t.boolean  "promote_crm",                            default: false
    t.integer  "adwords_logo_media_id",        limit: 8
  end

  add_index "companies", ["subdomain"], name: "index_companies_on_subdomain", unique: true, using: :btree

  create_table "contributions", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "success_id"
    t.string   "role"
    t.text     "contribution"
    t.text     "feedback"
    t.string   "status"
    t.boolean  "linkedin",                default: false
    t.datetime "created_at",                              null: false
    t.datetime "updated_at",                              null: false
    t.datetime "remind_at"
    t.integer  "remind_1_wait",           default: 1
    t.integer  "remind_2_wait",           default: 2
    t.string   "access_token"
    t.integer  "referrer_id"
    t.text     "notes"
    t.datetime "submitted_at"
    t.datetime "request_received_at"
    t.boolean  "publish_contributor",     default: true
    t.boolean  "contributor_unpublished", default: false
    t.boolean  "preview_contributor",     default: false
    t.boolean  "complete",                default: false
    t.integer  "email_template_id"
  end

  add_index "contributions", ["email_template_id"], name: "index_contributions_on_email_template_id", using: :btree
  add_index "contributions", ["success_id"], name: "index_contributions_on_success_id", using: :btree
  add_index "contributions", ["user_id"], name: "index_contributions_on_user_id", using: :btree

  create_table "ctas_successes", force: :cascade do |t|
    t.integer  "call_to_action_id"
    t.integer  "success_id"
    t.datetime "created_at",        null: false
    t.datetime "updated_at",        null: false
  end

  add_index "ctas_successes", ["call_to_action_id"], name: "index_ctas_successes_on_call_to_action_id", using: :btree
  add_index "ctas_successes", ["success_id"], name: "index_ctas_successes_on_success_id", using: :btree

  create_table "customers", force: :cascade do |t|
    t.string   "name",       null: false
    t.string   "logo_url"
    t.integer  "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string   "slug"
  end

  add_index "customers", ["company_id"], name: "index_customers_on_company_id", using: :btree
  add_index "customers", ["name", "company_id"], name: "index_customers_on_name_and_company_id", unique: true, using: :btree

  create_table "delayed_jobs", force: :cascade do |t|
    t.integer  "priority",   default: 0, null: false
    t.integer  "attempts",   default: 0, null: false
    t.text     "handler",                null: false
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.string   "queue"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "delayed_jobs", ["priority", "run_at"], name: "delayed_jobs_priority", using: :btree

  create_table "email_contribution_requests", force: :cascade do |t|
    t.integer  "contribution_id"
    t.string   "subject"
    t.string   "body"
    t.datetime "created_at",      null: false
    t.datetime "updated_at",      null: false
  end

  add_index "email_contribution_requests", ["contribution_id"], name: "index_email_contribution_requests_on_contribution_id", using: :btree

  create_table "email_templates", force: :cascade do |t|
    t.string   "name"
    t.string   "subject"
    t.text     "body"
    t.integer  "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "email_templates", ["company_id"], name: "index_email_templates_on_company_id", using: :btree

  create_table "friendly_id_slugs", force: :cascade do |t|
    t.string   "slug",                      null: false
    t.integer  "sluggable_id",              null: false
    t.string   "sluggable_type", limit: 50
    t.string   "scope"
    t.datetime "created_at"
  end

  add_index "friendly_id_slugs", ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true, using: :btree
  add_index "friendly_id_slugs", ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type", using: :btree
  add_index "friendly_id_slugs", ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id", using: :btree
  add_index "friendly_id_slugs", ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type", using: :btree

  create_table "opt_outs", force: :cascade do |t|
    t.string   "email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "outbound_actions", force: :cascade do |t|
    t.string   "link_url"
    t.integer  "company_id"
    t.datetime "created_at",   null: false
    t.datetime "updated_at",   null: false
    t.string   "type"
    t.text     "form_html"
    t.string   "display_text"
    t.string   "description"
  end

  add_index "outbound_actions", ["company_id"], name: "index_outbound_actions_on_company_id", using: :btree

  create_table "outbound_actions_stories", force: :cascade do |t|
    t.integer  "outbound_action_id"
    t.integer  "story_id"
    t.datetime "created_at",         null: false
    t.datetime "updated_at",         null: false
  end

  add_index "outbound_actions_stories", ["outbound_action_id"], name: "index_outbound_actions_stories_on_outbound_action_id", using: :btree
  add_index "outbound_actions_stories", ["story_id"], name: "index_outbound_actions_stories_on_story_id", using: :btree

  create_table "products", force: :cascade do |t|
    t.string   "name",        null: false
    t.text     "description"
    t.integer  "company_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.string   "slug"
  end

  add_index "products", ["company_id"], name: "index_products_on_company_id", using: :btree
  add_index "products", ["name", "company_id"], name: "index_products_on_name_and_company_id", unique: true, using: :btree

  create_table "products_successes", force: :cascade do |t|
    t.integer  "success_id"
    t.integer  "product_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "products_successes", ["product_id"], name: "index_products_successes_on_product_id", using: :btree
  add_index "products_successes", ["success_id"], name: "index_products_successes_on_success_id", using: :btree

  create_table "prompts", force: :cascade do |t|
    t.string   "description"
    t.integer  "success_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  add_index "prompts", ["success_id"], name: "index_prompts_on_success_id", using: :btree

  create_table "results", force: :cascade do |t|
    t.string   "description"
    t.integer  "success_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  add_index "results", ["success_id"], name: "index_results_on_success_id", using: :btree

  create_table "stories", force: :cascade do |t|
    t.string   "title",                                                                                                                                                                                                                                                                          null: false
    t.text     "quote"
    t.text     "quote_attr"
    t.string   "video_url"
    t.integer  "success_id"
    t.datetime "created_at",                                                                                                                                                                                                                                                                     null: false
    t.datetime "updated_at",                                                                                                                                                                                                                                                                     null: false
    t.boolean  "approved",          default: false
    t.boolean  "published",         default: false
    t.boolean  "logo_published",    default: false
    t.datetime "publish_date"
    t.datetime "logo_publish_date"
    t.string   "slug"
    t.text     "content",           default: "<p><strong>Situation</strong></p><p>Situation description</p><p><strong>Challenge</strong></p><p>Challenge description</p><p><strong>Solution</strong></p><p>Solution description</p><p><strong>Benefits</strong></p><p>Benefits description</p>"
    t.string   "quote_attr_name"
    t.string   "quote_attr_title"
    t.boolean  "preview_published", default: false
    t.text     "summary"
  end

  add_index "stories", ["success_id"], name: "index_stories_on_success_id", using: :btree
  add_index "stories", ["title"], name: "index_stories_on_title", unique: true, using: :btree

  create_table "story_categories", force: :cascade do |t|
    t.string   "name"
    t.string   "slug"
    t.integer  "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "story_categories", ["company_id"], name: "index_story_categories_on_company_id", using: :btree
  add_index "story_categories", ["name", "company_id"], name: "index_story_categories_on_name_and_company_id", unique: true, using: :btree

  create_table "story_categories_successes", force: :cascade do |t|
    t.integer  "story_category_id"
    t.integer  "success_id"
    t.datetime "created_at",        null: false
    t.datetime "updated_at",        null: false
  end

  add_index "story_categories_successes", ["story_category_id"], name: "index_story_categories_successes_on_story_category_id", using: :btree
  add_index "story_categories_successes", ["success_id"], name: "index_story_categories_successes_on_success_id", using: :btree

  create_table "successes", force: :cascade do |t|
    t.integer  "customer_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.integer  "curator_id"
    t.string   "name"
    t.text     "description"
  end

  add_index "successes", ["curator_id"], name: "index_successes_on_curator_id", using: :btree
  add_index "successes", ["customer_id"], name: "index_successes_on_customer_id", using: :btree

  create_table "users", force: :cascade do |t|
    t.string   "email",                  default: "",    null: false
    t.string   "encrypted_password",     default: "",    null: false
    t.string   "first_name"
    t.string   "last_name"
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0,     null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet     "current_sign_in_ip"
    t.inet     "last_sign_in_ip"
    t.string   "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string   "unconfirmed_email"
    t.integer  "failed_attempts",        default: 0,     null: false
    t.string   "unlock_token"
    t.datetime "locked_at"
    t.datetime "created_at",                             null: false
    t.datetime "updated_at",                             null: false
    t.integer  "company_id"
    t.string   "linkedin_url"
    t.string   "photo_url"
    t.string   "phone"
    t.string   "title"
    t.boolean  "admin",                  default: false
    t.string   "linkedin_title"
    t.string   "linkedin_company"
    t.string   "linkedin_location"
    t.string   "linkedin_photo_url"
  end

  add_index "users", ["company_id"], name: "index_users_on_company_id", using: :btree
  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree

  create_table "visitor_actions", force: :cascade do |t|
    t.string   "type"
    t.integer  "success_id"
    t.integer  "visitor_session_id"
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
    t.boolean  "landing",            default: false
    t.string   "description"
    t.integer  "company_id"
    t.datetime "timestamp"
  end

  add_index "visitor_actions", ["company_id"], name: "index_visitor_actions_on_company_id", using: :btree
  add_index "visitor_actions", ["success_id"], name: "index_visitor_actions_on_success_id", using: :btree
  add_index "visitor_actions", ["visitor_session_id"], name: "index_visitor_actions_on_visitor_session_id", using: :btree

  create_table "visitor_sessions", force: :cascade do |t|
    t.datetime "timestamp"
    t.string   "referrer_type"
    t.integer  "visitor_id"
    t.datetime "created_at",        null: false
    t.datetime "updated_at",        null: false
    t.string   "clicky_session_id"
    t.string   "ip_address"
    t.string   "organization"
    t.string   "location"
  end

  add_index "visitor_sessions", ["clicky_session_id"], name: "index_visitor_sessions_on_clicky_session_id", unique: true, using: :btree
  add_index "visitor_sessions", ["visitor_id"], name: "index_visitor_sessions_on_visitor_id", using: :btree

  create_table "visitors", force: :cascade do |t|
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
    t.string   "clicky_uid"
    t.integer  "visitor_sessions_count", default: 0
  end

  add_index "visitors", ["clicky_uid"], name: "index_visitors_on_clicky_uid", unique: true, using: :btree

  create_table "widgets", force: :cascade do |t|
    t.integer  "company_id"
    t.boolean  "show",       default: false
    t.integer  "show_delay", default: 5000
    t.boolean  "hide",       default: false
    t.integer  "hide_delay", default: 5000
    t.string   "tab_color",  default: "#ddd"
    t.string   "text_color", default: "#333"
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
    t.integer  "show_freq",  default: 7
  end

  add_index "widgets", ["company_id"], name: "index_widgets_on_company_id", using: :btree

  add_foreign_key "adwords_ad_groups", "adwords_campaigns"
  add_foreign_key "adwords_ads", "adwords_ad_groups"
  add_foreign_key "adwords_ads", "stories"
  add_foreign_key "adwords_ads_images", "adwords_ads"
  add_foreign_key "adwords_ads_images", "adwords_images"
  add_foreign_key "adwords_campaigns", "companies"
  add_foreign_key "adwords_images", "companies"
  add_foreign_key "call_to_actions", "companies"
  add_foreign_key "contributions", "email_templates"
  add_foreign_key "contributions", "successes"
  add_foreign_key "contributions", "users"
  add_foreign_key "ctas_successes", "call_to_actions"
  add_foreign_key "ctas_successes", "successes"
  add_foreign_key "customers", "companies"
  add_foreign_key "email_contribution_requests", "contributions"
  add_foreign_key "email_templates", "companies"
  add_foreign_key "outbound_actions", "companies"
  add_foreign_key "outbound_actions_stories", "outbound_actions"
  add_foreign_key "outbound_actions_stories", "stories"
  add_foreign_key "products", "companies"
  add_foreign_key "products_successes", "products"
  add_foreign_key "products_successes", "successes"
  add_foreign_key "prompts", "successes"
  add_foreign_key "results", "successes"
  add_foreign_key "stories", "successes"
  add_foreign_key "story_categories", "companies"
  add_foreign_key "story_categories_successes", "story_categories"
  add_foreign_key "story_categories_successes", "successes"
  add_foreign_key "successes", "customers"
  add_foreign_key "successes", "users", column: "curator_id"
  add_foreign_key "users", "companies"
  add_foreign_key "visitor_actions", "companies"
  add_foreign_key "visitor_actions", "successes"
  add_foreign_key "visitor_actions", "visitor_sessions"
  add_foreign_key "visitor_sessions", "visitors"
  add_foreign_key "widgets", "companies"
end
