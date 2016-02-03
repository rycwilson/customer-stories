class SiteController < ApplicationController

  def index
    if current_user.try :company
      redirect_to company_path(current_user.company_id)
    end
  end

end
