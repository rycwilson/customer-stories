class EmailTemplatesController < ApplicationController

  before_action :set_template

  # note: html attributes in the template start as single quote,
  #       after updating they become escaped double quote
  # note: saving template without any changes leads to an empty template body (??)
  def show
    # insert curator's photo
    @template.body.sub! "[curator_img_url]", current_user.photo_url
    # give anchor links a format that allows for editing text of the link
    # don't want to include actual links, as they'll be broken (placeholders instead of actual urls)
    @template.body.gsub!(/<a\shref=('|\")\[(\w+)\]('|\")>(.+)<\/a>/, '[\2 link_text="\4"]')
    # highlight all placeholders, links, and urls
    @template.body.gsub!(/(\[(\w|\s|=|('|\")|-)+\])/, '<span style="color:red">\1</span>')
    respond_to { |format| format.json { render json: @template } }
  end

  def update
    # modified_body = params[:template][:body]
    #                       .gsub!(/<span>(.+)<\/span>/, '\1')
    if @template.update( subject: params[:template][:subject],
                            body: params[:template][:body] )
      flash.now[:success] = "Changes saved"
      respond_to { |format| format.js { render action: 'update_success' } }
    else
      flash.now[:danger] = "Can't save changes: #{@template.errors.full_messages.join(', ')}"
      respond_to { |format| format.js { render action: 'update_error' } }
    end
  end

  private

  def set_template
    @template = EmailTemplate.find params[:id]
  end

  def revert_template
  end

end
