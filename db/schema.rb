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

ActiveRecord::Schema.define(version: 20181114151742) do

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
    t.index ["email"], name: "index_admins_on_email", unique: true, using: :btree
  end

  create_table "adwords_ad_groups", force: :cascade do |t|
    t.integer  "adwords_campaign_id"
    t.bigint   "ad_group_id"
    t.string   "name"
    t.string   "status",              default: "PAUSED"
    t.datetime "created_at",                             null: false
    t.datetime "updated_at",                             null: false
    t.index ["adwords_campaign_id"], name: "index_adwords_ad_groups_on_adwords_campaign_id", using: :btree
  end

  create_table "adwords_ads", force: :cascade do |t|
    t.integer  "adwords_ad_group_id"
    t.integer  "story_id"
    t.bigint   "ad_id"
    t.string   "status",              default: "PAUSED"
    t.string   "approval_status",     default: "UNCHECKED"
    t.string   "long_headline"
    t.datetime "created_at",                                null: false
    t.datetime "updated_at",                                null: false
    t.index ["adwords_ad_group_id"], name: "index_adwords_ads_on_adwords_ad_group_id", using: :btree
    t.index ["story_id"], name: "index_adwords_ads_on_story_id", using: :btree
  end

  create_table "adwords_ads_images", force: :cascade do |t|
    t.bigint   "adwords_ad_id"
    t.bigint   "adwords_image_id"
    t.datetime "created_at",       null: false
    t.datetime "updated_at",       null: false
    t.index ["adwords_ad_id"], name: "index_adwords_ads_images_on_adwords_ad_id", using: :btree
    t.index ["adwords_image_id"], name: "index_adwords_ads_images_on_adwords_image_id", using: :btree
  end

  create_table "adwords_campaigns", force: :cascade do |t|
    t.integer  "company_id"
    t.bigint   "campaign_id"
    t.string   "type"
    t.string   "name"
    t.string   "status",      default: "PAUSED"
    t.datetime "created_at",                     null: false
    t.datetime "updated_at",                     null: false
    t.index ["company_id"], name: "index_adwords_campaigns_on_company_id", using: :btree
  end

  create_table "adwords_images", force: :cascade do |t|
    t.integer  "company_id"
    t.string   "image_url"
    t.datetime "created_at",                      null: false
    t.datetime "updated_at",                      null: false
    t.boolean  "company_default", default: false
    t.bigint   "media_id"
    t.index ["company_id"], name: "index_adwords_images_on_company_id", using: :btree
  end

  create_table "call_to_actions", force: :cascade do |t|
    t.string   "type"
    t.integer  "company_id"
    t.string   "link_url"
    t.string   "description"
    t.text     "form_html"
    t.string   "display_text"
    t.datetime "created_at",                   null: false
    t.datetime "updated_at",                   null: false
    t.boolean  "primary",      default: false
    t.index ["company_id"], name: "index_call_to_actions_on_company_id", using: :btree
  end

  create_table "companies", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at",                                       null: false
    t.datetime "updated_at",                                       null: false
    t.string   "logo_file_name"
    t.string   "logo_content_type"
    t.integer  "logo_file_size"
    t.datetime "logo_updated_at"
    t.string   "logo_url"
    t.string   "subdomain"
    t.string   "feature_flag",                 default: "beta"
    t.string   "header_color_1",               default: "#ffffff"
    t.string   "header_color_2",               default: "#ffffff"
    t.string   "header_text_color",            default: "#333333"
    t.string   "website"
    t.string   "gtm_id"
    t.string   "primary_cta_background_color", default: "#337ab7"
    t.string   "primary_cta_text_color",       default: "#ffffff"
    t.string   "adwords_logo_url"
    t.string   "adwords_short_headline"
    t.boolean  "promote_tr",                   default: false
    t.boolean  "promote_crm",                  default: false
    t.bigint   "adwords_logo_media_id"
    t.index ["subdomain"], name: "index_companies_on_subdomain", unique: true, using: :btree
  end

  create_table "contributions", force: :cascade do |t|
    t.integer  "contributor_id"
    t.integer  "success_id"
    t.string   "role"
    t.text     "contribution"
    t.text     "feedback"
    t.string   "status",                  default: "pre_request"
    t.boolean  "linkedin",                default: false
    t.datetime "created_at",                                      null: false
    t.datetime "updated_at",                                      null: false
    t.datetime "request_remind_at"
    t.integer  "first_reminder_wait",     default: 2
    t.integer  "second_reminder_wait",    default: 3
    t.string   "access_token"
    t.integer  "referrer_id"
    t.text     "notes"
    t.datetime "submitted_at"
    t.datetime "request_received_at"
    t.boolean  "publish_contributor",     default: true
    t.boolean  "contributor_unpublished", default: false
    t.boolean  "preview_contributor",     default: false
    t.integer  "invitation_template_id"
    t.string   "request_subject"
    t.text     "request_body"
    t.datetime "request_sent_at"
    t.boolean  "success_contact",         default: false
    t.index ["contributor_id"], name: "index_contributions_on_contributor_id", using: :btree
    t.index ["invitation_template_id"], name: "index_contributions_on_invitation_template_id", using: :btree
    t.index ["success_id"], name: "index_contributions_on_success_id", using: :btree
  end

  create_table "contributor_answers", force: :cascade do |t|
    t.text     "answer"
    t.integer  "contribution_id"
    t.integer  "contributor_question_id"
    t.datetime "created_at",              null: false
    t.datetime "updated_at",              null: false
    t.index ["contribution_id"], name: "index_contributor_answers_on_contribution_id", using: :btree
    t.index ["contributor_question_id"], name: "index_contributor_answers_on_contributor_question_id", using: :btree
  end

  create_table "contributor_questions", force: :cascade do |t|
    t.integer  "company_id"
    t.string   "question"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string   "role"
    t.index ["company_id"], name: "index_contributor_questions_on_company_id", using: :btree
  end

  create_table "ctas_successes", force: :cascade do |t|
    t.integer  "call_to_action_id"
    t.integer  "success_id"
    t.datetime "created_at",        null: false
    t.datetime "updated_at",        null: false
    t.index ["call_to_action_id"], name: "index_ctas_successes_on_call_to_action_id", using: :btree
    t.index ["success_id"], name: "index_ctas_successes_on_success_id", using: :btree
  end

  create_table "customers", force: :cascade do |t|
    t.string   "name",                               null: false
    t.string   "logo_url"
    t.integer  "company_id"
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
    t.string   "slug"
    t.boolean  "show_name_with_logo", default: true
    t.index ["company_id"], name: "index_customers_on_company_id", using: :btree
    t.index ["name", "company_id"], name: "index_customers_on_name_and_company_id", unique: true, using: :btree
  end

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
    t.index ["priority", "run_at"], name: "delayed_jobs_priority", using: :btree
  end

  create_table "email_contribution_requests", force: :cascade do |t|
    t.integer  "contribution_id"
    t.string   "subject"
    t.string   "body"
    t.datetime "created_at",      null: false
    t.datetime "updated_at",      null: false
    t.index ["contribution_id"], name: "index_email_contribution_requests_on_contribution_id", using: :btree
  end

  create_table "email_templates", force: :cascade do |t|
    t.string   "name"
    t.string   "subject"
    t.text     "body"
    t.integer  "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_email_templates_on_company_id", using: :btree
  end

  create_table "friendly_id_slugs", force: :cascade do |t|
    t.string   "slug",                      null: false
    t.integer  "sluggable_id",              null: false
    t.string   "sluggable_type", limit: 50
    t.string   "scope"
    t.datetime "created_at"
    t.index ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true, using: :btree
    t.index ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type", using: :btree
    t.index ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id", using: :btree
    t.index ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type", using: :btree
  end

  create_table "invitation_templates", force: :cascade do |t|
    t.integer  "company_id"
    t.string   "name"
    t.string   "request_subject"
    t.string   "request_body"
    t.datetime "created_at",                                                                   null: false
    t.datetime "updated_at",                                                                   null: false
    t.string   "contribution_page_title", default: "Thank you for contributing your insights"
    t.string   "feedback_page_title",     default: "Thank you for your feedback"
    t.index ["company_id"], name: "index_invitation_templates_on_company_id", using: :btree
  end

  create_table "oauth_access_grants", force: :cascade do |t|
    t.integer  "resource_owner_id", null: false
    t.integer  "application_id",    null: false
    t.string   "token",             null: false
    t.integer  "expires_in",        null: false
    t.text     "redirect_uri",      null: false
    t.datetime "created_at",        null: false
    t.datetime "revoked_at"
    t.string   "scopes"
    t.index ["token"], name: "index_oauth_access_grants_on_token", unique: true, using: :btree
  end

  create_table "oauth_access_tokens", force: :cascade do |t|
    t.integer  "resource_owner_id"
    t.integer  "application_id"
    t.string   "token",                               null: false
    t.string   "refresh_token"
    t.integer  "expires_in"
    t.datetime "revoked_at"
    t.datetime "created_at",                          null: false
    t.string   "scopes"
    t.string   "previous_refresh_token", default: "", null: false
    t.index ["refresh_token"], name: "index_oauth_access_tokens_on_refresh_token", unique: true, using: :btree
    t.index ["resource_owner_id"], name: "index_oauth_access_tokens_on_resource_owner_id", using: :btree
    t.index ["token"], name: "index_oauth_access_tokens_on_token", unique: true, using: :btree
  end

  create_table "oauth_applications", force: :cascade do |t|
    t.string   "name",                      null: false
    t.string   "uid",                       null: false
    t.string   "secret",                    null: false
    t.text     "redirect_uri",              null: false
    t.string   "scopes",       default: "", null: false
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
    t.index ["uid"], name: "index_oauth_applications_on_uid", unique: true, using: :btree
  end

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
    t.index ["company_id"], name: "index_outbound_actions_on_company_id", using: :btree
  end

  create_table "outbound_actions_stories", force: :cascade do |t|
    t.integer  "outbound_action_id"
    t.integer  "story_id"
    t.datetime "created_at",         null: false
    t.datetime "updated_at",         null: false
    t.index ["outbound_action_id"], name: "index_outbound_actions_stories_on_outbound_action_id", using: :btree
    t.index ["story_id"], name: "index_outbound_actions_stories_on_story_id", using: :btree
  end

  create_table "plugins", force: :cascade do |t|
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
    t.index ["company_id"], name: "index_plugins_on_company_id", using: :btree
  end

  create_table "products", force: :cascade do |t|
    t.string   "name",        null: false
    t.text     "description"
    t.integer  "company_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.string   "slug"
    t.index ["company_id"], name: "index_products_on_company_id", using: :btree
    t.index ["name", "company_id"], name: "index_products_on_name_and_company_id", unique: true, using: :btree
  end

  create_table "products_successes", force: :cascade do |t|
    t.integer  "success_id"
    t.integer  "product_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_products_successes_on_product_id", using: :btree
    t.index ["success_id"], name: "index_products_successes_on_success_id", using: :btree
  end

  create_table "prompts", force: :cascade do |t|
    t.string   "description"
    t.integer  "success_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.index ["success_id"], name: "index_prompts_on_success_id", using: :btree
  end

  create_table "results", force: :cascade do |t|
    t.string   "description"
    t.integer  "success_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.index ["success_id"], name: "index_results_on_success_id", using: :btree
  end

  create_table "stories", force: :cascade do |t|
    t.string   "title",                                                                                                                                                                                                                                                                             null: false
    t.text     "quote"
    t.text     "quote_attr"
    t.string   "video_url"
    t.integer  "success_id"
    t.datetime "created_at",                                                                                                                                                                                                                                                                        null: false
    t.datetime "updated_at",                                                                                                                                                                                                                                                                        null: false
    t.boolean  "approved",             default: false
    t.boolean  "published",            default: false
    t.boolean  "logo_published",       default: false
    t.datetime "publish_date"
    t.datetime "logo_publish_date"
    t.string   "slug"
    t.text     "narrative",            default: "<p><strong>Situation</strong></p><p>Situation description</p><p><strong>Challenge</strong></p><p>Challenge description</p><p><strong>Solution</strong></p><p>Solution description</p><p><strong>Benefits</strong></p><p>Benefits description</p>"
    t.string   "quote_attr_name"
    t.string   "quote_attr_title"
    t.boolean  "preview_published",    default: false
    t.text     "summary"
    t.datetime "preview_publish_date"
    t.index ["success_id"], name: "index_stories_on_success_id", using: :btree
    t.index ["title"], name: "index_stories_on_title", unique: true, using: :btree
  end

  create_table "story_categories", force: :cascade do |t|
    t.string   "name"
    t.string   "slug"
    t.integer  "company_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_story_categories_on_company_id", using: :btree
    t.index ["name", "company_id"], name: "index_story_categories_on_name_and_company_id", unique: true, using: :btree
  end

  create_table "story_categories_successes", force: :cascade do |t|
    t.integer  "story_category_id"
    t.integer  "success_id"
    t.datetime "created_at",        null: false
    t.datetime "updated_at",        null: false
    t.index ["story_category_id"], name: "index_story_categories_successes_on_story_category_id", using: :btree
    t.index ["success_id"], name: "index_story_categories_successes_on_success_id", using: :btree
  end

  create_table "successes", force: :cascade do |t|
    t.integer  "customer_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.integer  "curator_id"
    t.string   "name"
    t.text     "description"
    t.index ["curator_id"], name: "index_successes_on_curator_id", using: :btree
    t.index ["customer_id"], name: "index_successes_on_customer_id", using: :btree
  end

  create_table "templates_questions", force: :cascade do |t|
    t.integer  "invitation_template_id"
    t.integer  "contributor_question_id"
    t.datetime "created_at",              null: false
    t.datetime "updated_at",              null: false
  end

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
    t.index ["company_id"], name: "index_users_on_company_id", using: :btree
    t.index ["email"], name: "index_users_on_email", unique: true, using: :btree
  end

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
    t.index ["company_id"], name: "index_visitor_actions_on_company_id", using: :btree
    t.index ["success_id"], name: "index_visitor_actions_on_success_id", using: :btree
    t.index ["visitor_session_id"], name: "index_visitor_actions_on_visitor_session_id", using: :btree
  end

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
    t.index ["clicky_session_id"], name: "index_visitor_sessions_on_clicky_session_id", unique: true, using: :btree
    t.index ["visitor_id"], name: "index_visitor_sessions_on_visitor_id", using: :btree
  end

  create_table "visitors", force: :cascade do |t|
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
    t.string   "clicky_uid"
    t.integer  "visitor_sessions_count", default: 0
    t.index ["clicky_uid"], name: "index_visitors_on_clicky_uid", unique: true, using: :btree
  end

  add_foreign_key "adwords_ad_groups", "adwords_campaigns"
  add_foreign_key "adwords_ads", "adwords_ad_groups"
  add_foreign_key "adwords_ads", "stories"
  add_foreign_key "adwords_ads_images", "adwords_ads"
  add_foreign_key "adwords_ads_images", "adwords_images"
  add_foreign_key "adwords_campaigns", "companies"
  add_foreign_key "adwords_images", "companies"
  add_foreign_key "call_to_actions", "companies"
  add_foreign_key "contributions", "successes"
  add_foreign_key "contributions", "users", column: "contributor_id"
  add_foreign_key "contributor_answers", "contributions"
  add_foreign_key "contributor_answers", "contributor_questions"
  add_foreign_key "contributor_questions", "companies"
  add_foreign_key "ctas_successes", "call_to_actions"
  add_foreign_key "ctas_successes", "successes"
  add_foreign_key "customers", "companies"
  add_foreign_key "email_contribution_requests", "contributions"
  add_foreign_key "email_templates", "companies"
  add_foreign_key "invitation_templates", "companies"
  add_foreign_key "oauth_access_grants", "oauth_applications", column: "application_id"
  add_foreign_key "oauth_access_tokens", "oauth_applications", column: "application_id"
  add_foreign_key "outbound_actions", "companies"
  add_foreign_key "outbound_actions_stories", "outbound_actions"
  add_foreign_key "outbound_actions_stories", "stories"
  add_foreign_key "plugins", "companies"
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
end
