class CompaniesController < ApplicationController

  before_action :user_authorized?, only: [:show, :edit]
  before_action :set_company, except: [:new, :create]
  before_action only: [:show, :edit] { set_gon(@company) }
  before_action :set_s3_direct_post, only: [:new, :edit, :create]

  def new
    @company = Company.new
  end

  def show
    @workflow_tab = cookies[:csp_workflow_tab] || 'curate'
    cookies.delete(:csp_workflow_tab) if cookies[:csp_workflow_tab]
    @customer_select_options = @company.customer_select_options
    @category_select_options = @company.category_select_options
    @product_select_options = @company.product_select_options
    # Measure
    @company_page_views_count = @company.page_views.length.to_f
    @company_index_views_count = PageView.company_index_views(@company.id).length.to_f
    @company_index_unique_visitors = Set.new
    PageView.company_index_views(@company.id).each do |page_view|
      @company_index_unique_visitors << page_view.visitor
    end
  end

  def edit
    @category_select_options = @company.category_select_options
    @category_pre_selected_options = @company.story_categories.map { |category| category.id }
    @product_select_options = @company.product_select_options
    @product_pre_selected_options = @company.products.map { |product| product.id }
    @templates_select = @company.templates_select
  end

  def create
    @company = Company.new company_params
    if @company.save
      @company.update_tags(params[:company_tags]) if params[:company_tags].present?
      @company.users << current_user
      @company.create_email_templates
      if current_user.linkedin_url.present?
        redirect_to File.join(request.protocol + "#{@company.subdomain}." + request.domain + request.port_string, company_path(@company)), flash: { success: "Account setup complete" }
      else
        redirect_to File.join(request.protocol + "#{@company.subdomain}." + request.domain + request.port_string, edit_profile_path), flash: { info: "Complete your account setup by connecting to LinkedIn" }
      end
    else
      # validation(s): presence / uniqueness of name, presence of subdomain
      flash[:danger] = @company.errors.full_messages.join(', ')
      redirect_to new_company_path
    end

  end

  def update
    if @company.update company_params
      @company.update_tags(params[:company_tags]) if params[:company_tags].present?
      @flash_mesg = "Company updated"
      @flash_status = "success"
    else
      @flash_mesg = @company.errors.full_messages.join(', ')
      @flash_status = "danger"
    end
    if @company.cta_button.blank?
      @company.cta_button = CtaButton.create(
                             url: params[:cta][:url],
                             btn_text: params[:cta][:btn_text],
                             color: params[:cta][:color],
                             background_color: params[:cta][:background_color])
    else
      @company.cta_button.update(
                url: params[:cta][:url],
                btn_text: params[:cta][:btn_text],
                color: params[:cta][:color],
                background_color: params[:cta][:background_color])
    end

    respond_to do |format|
      format.html do
        redirect_to edit_company_path(@company),
          flash: { success: "Company updated" }
      end
      format.js
    end
  end

  def activity
    days_ago = 5  # today = 0
    contribution_submissions = @company.contribution_submissions_activity(days_ago)
    contribution_requests_received = @company.contribution_requests_received_activity(days_ago)
    stories_created = @company.stories_created_activity(days_ago)
    stories_published = @company.stories_published_activity(days_ago)
    stories_logo_published = @company.stories_logo_published_activity(days_ago)
    story_views = @company.story_views_activity(days_ago)
    # story_shares = @company.story_shares(days_ago)

    events = (contribution_submissions +
              contribution_requests_received +
              stories_created +
              stories_published +
              stories_logo_published +
              story_views)
                .sort_by { |event| event[:timestamp] }.reverse

    remove_redundant_events(events) unless events.empty?

    respond_to do |format|
      format.json { render json: { events: events } }
    end

    # sessions_organizations = []
    # actions_list_request = Typhoeus::Request.new(
    #   GETCLICKY_API_BASE_URL,
    #   method: :get,
    #   body: nil,
    #   params: { site_id: ENV['GETCLICKY_SITE_ID'],
    #             sitekey: ENV['GETCLICKY_SITE_KEY'],
    #             type: 'actions-list',
    #             date: 'last-7-days',
    #             limit: '100',
    #             output: 'json' },
    #   headers: { Accept: "application/json" }
    # )
    # actions_list_request.run
    # actions_list = JSON.parse(actions_list_request.response.response_body)[0]['dates'][0]['items']
    # actions_list.each_with_index do |action, index|
    #   story_slug = action['action_url'].slice(action['action_url'].rindex('/') + 1, action['action_url'].length)
    #   if action['action_type'] == 'pageview' &&
    #      action['action_url'].include?("#{@company.subdomain}.#{ENV['HOST_NAME']}") &&
    #      # filter out landing page or stories#index views
    #      # (clicky isn't correctly logging 'action_title' for all stories,
    #      # so reference 'action_url' instead)
    #      (story = Story.joins(success: { customer: {} } )
    #                    .where(slug: story_slug, customers: { company_id: @company.id })[0])
    #     story_views << { event: 'story_view',
    #                      target: { title: story.title, path: story.csp_story_path },
    #                      customer: story.success.customer.name,
    #                      geolocation: '',  # to be filled in after we get visitor info
    #                      organization: '',
    #                      session_id: action['session_id'],
    #                      timestamp: DateTime.strptime(action['time'], '%s') }
    #     sessions_organizations << { session_id: action['session_id'], organization: '' }
    #   elsif action['action_type'] == 'click'
    #     shared_story_slug = ''
    #     if action['action_url'].include?('linkedin') ||
    #        action['action_url'].include?('twitter') ||
    #        action['action_url'].include?('facebook')
    #       provider = action['action_url'].include?('linkedin') ? 'linkedin' :
    #                  (action['action_url'].include?('twitter') ? 'twitter' : 'facebook')
    #       # since the shared story click doesn't contain company info,
    #       # find the most recent 'pageview' action that corresponds to the session_id,
    #       # then check if it belongs to @company
    #       actions_list[index+1..actions_list.length].each do |prev_action|
    #         if prev_action['action_type'] == 'pageview' &&
    #            prev_action['session_id'] == action['session_id']
    #           if prev_action['action_url'].include?("#{@company.subdomain}.#{ENV['HOST_NAME']}")
    #             shared_story_slug = prev_action['action_url'].slice(prev_action['action_url'].rindex('/') + 1, prev_action['action_url'].length)
    #           end
    #           break # whether the share belongs to @company or not
    #         end
    #       end
    #       if shared_story_slug.present?  # it will be blank if story belongs to another company
    #         story = Story.friendly.find(shared_story_slug)
    #         story_shares << { event: 'story_share',
    #                           target: { title: story.title, path: story.csp_story_path },
    #                           customer: story.success.customer.name,
    #                           provider: provider,
    #                           organization: '',
    #                           session_id: action['session_id'],
    #                           timestamp: DateTime.strptime(action['time'], '%s') }
    #         sessions_organizations << { session_id: action['session_id'], organization: '' }
    #       end
    #     end
    #   end
    # end

    # sessions_organizations.uniq! { |session| session[:session_id] }

    # story_views.uniq! { |view| view.values_at(:target, :session_id) }

    # # clicky limits api requests to one per ip address per site id at a time
    # hydra = Typhoeus::Hydra.new(max_concurrency: 1)

    # story_views_visitors_list_requests =
    #   story_views.map do |view|
    #     request = clicky_session_request(view[:session_id], @company)
    #     hydra.queue(request)
    #     request
    #   end

    # story_shares_visitors_list_requests =
    #   story_shares.map do |share|
    #     request = clicky_session_request(share[:session_id], @company)
    #     hydra.queue(request)
    #     request
    #   end

    # hydra.run

    # # fill in missing info ...
    # story_views_visitors_list_requests.each_with_index do |request, index|
    #   story_views[index][:geolocation] =
    #     JSON.parse(request.response.body)[0]['dates'][0]['items'][0]['geolocation']
    #   story_views[index][:organization] =
    #     JSON.parse(request.response.body)[0]['dates'][0]['items'][0]['organization']
    # end

    # story_shares_visitors_list_requests.each_with_index do |request, index|
    #   story_shares[index][:organization] =
    #     JSON.parse(request.response.body)[0]['dates'][0]['items'][0]['organization']
    # end


  end

  private

  def company_params
    params.require(:company).permit(:name, :subdomain, :logo_url, :nav_color_1,
                                    :nav_color_2, :nav_text_color, :website, :gtm_id)
  end

  def set_company
    @company = Company.find params[:id]
  end

  def user_authorized?
    if current_user.company_id == params[:id].to_i
      true
    else
      render file: 'public/403', status: 403, layout: false
      false
    end
  end

  def clicky_session_request session_id, company
    Typhoeus::Request.new(
      GETCLICKY_API_BASE_URL,
      method: :get,
      body: nil,
      params: { site_id: ENV['GETCLICKY_SITE_ID'],
                sitekey: ENV['GETCLICKY_SITE_KEY'],
                type: 'visitors-list',
                date: company.subdomain == 'varmour' ? 'last-1-days' : 'last-7-days',
                session_id: session_id,
                limit: 'all',
                output: 'json' },
      headers: { Accept: "application/json" }
    )
  end

  def remove_redundant_events events
    # if there was a submission event or contribution_request_received event,
    # remove any prior contribution_request_received events
    events.each_with_index do |event, index|
      if event[:event] == 'contribution_submission' ||
         event[:event] == 'contribution_request_received'
        events[index+1..events.length-1].each_with_index do |prior_event, prior_event_index|
          if prior_event[:event] == 'contribution_request_received' &&
             (prior_event[:target]['contributor']['full_name'] ==
                event[:target]['contributor']['full_name']) &&
             (prior_event[:target]['success']['story']['title'] ==
                event[:target]['success']['story']['title'])
            events.delete_at(index + (prior_event_index+1))
          end
        end
      end
    end
    events
  end

end
