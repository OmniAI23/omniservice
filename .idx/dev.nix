# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [ 
    pkgs.python3 
    pkgs.docker-compose 
    pkgs.ffmpeg 
    pkgs.nodejs_20
    pkgs.python311Packages.pip
  ];
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [ "ms-python.python" "dsznajder.es7-react-js-snippets" ];
    workspace = {
      # Runs when a workspace is first created with this \`dev.nix\` file
      onCreate = {
        backend-install = "cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt";
        frontend-install = "cd frontend && npm install";
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--prefix" "frontend" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
        api = {
          command = ["cd" "backend" "&&" "source" ".venv/bin/activate" "&&" "uvicorn" "main:app" "--host" "0.0.0.0" "--port" "8000"];
          manager = "web";
        };
      };
    };
  };
}
