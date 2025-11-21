"""
auth_service.py - Real Supabase authentication service
"""
import os
import logging
from typing import Optional, Dict, Any
from supabase import Client

logger = logging.getLogger(__name__)

class SupabaseAuthService:
    """Real Supabase authentication service for Warmth"""

    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    async def sign_in_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in user with email and password

        Returns:
            Dict with user data and session info
        """
        try:
            logger.info(f"Attempting sign in for user: {email}")
            result = self.supabase.auth.sign_in_with_password({
                'email': email,
                'password': password
            })

            logger.info(f"Sign in successful for user: {result.user.id}")
            return {
                'success': True,
                'user': result.user,
                'session': result.session
            }

        except Exception as e:
            logger.error(f"Sign in failed for {email}: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def sign_up_user(self, email: str, password: str, user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Sign up new user

        Returns:
            Dict with user data and session info
        """
        try:
            logger.info(f"Attempting sign up for user: {email}")

            # Prepare user metadata
            user_metadata = user_data or {}
            user_metadata.update({
                'display_name': email.split('@')[0],  # Default display name
                'app_source': 'warmth_mobile'
            })

            result = self.supabase.auth.sign_up({
                'email': email,
                'password': password,
                'options': {
                    'data': user_metadata
                }
            })

            logger.info(f"Sign up successful for user: {result.user.id}")
            return {
                'success': True,
                'user': result.user,
                'session': result.session
            }

        except Exception as e:
            logger.error(f"Sign up failed for {email}: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def create_dev_user(self, user_id: str, display_name: str = None) -> Dict[str, Any]:
        """
        Create/Get a development user using magic link approach
        This bypasses RLS by creating a proper Supabase user
        """
        try:
            # Generate a fake email for dev user
            dev_email = f"dev_{user_id}@warmth.local"

            logger.info(f"Creating/Getting dev user: {dev_email}")

            # Try to sign up with a known dev password
            dev_password = "dev_user_password_123"

            # First check if user exists by attempting sign up
            signup_result = await self.sign_up_user(
                email=dev_email,
                password=dev_password,
                user_data={
                    'display_name': display_name or user_id,
                    'is_development_user': True
                }
            )

            if signup_result['success']:
                logger.info(f"Dev user created: {signup_result['user'].id}")
                return signup_result
            else:
                # User might already exist, try sign in
                signin_result = await self.sign_in_user(dev_email, dev_password)
                if signin_result['success']:
                    logger.info(f"Existing dev user signed in: {signin_result['user'].id}")
                    return signin_result
                else:
                    # If sign in fails, user probably doesn't exist
                    logger.warning(f"Dev user creation failed: {signin_result['error']}")
                    return signin_result

        except Exception as e:
            logger.error(f"Dev user creation failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Get currently authenticated user"""
        try:
            user = self.supabase.auth.get_user()
            if user and hasattr(user, 'user'):
                return {
                    'id': user.user.id,
                    'email': user.user.email,
                    'display_name': user.user.user_metadata.get('display_name', user.user.email),
                    'is_dev_user': user.user.user_metadata.get('is_development_user', False),
                    'user_metadata': user.user.user_metadata
                }
            return None
        except Exception as e:
            logger.error(f"Error getting current user: {e}")
            return None

    def sign_out_user(self) -> Dict[str, Any]:
        """Sign out current user"""
        try:
            result = self.supabase.auth.sign_out()
            logger.info("User signed out successfully")
            return {'success': True}
        except Exception as e:
            logger.error(f"Sign out failed: {e}")
            return {'success': False, 'error': str(e)}

    async def refresh_session(self) -> Dict[str, Any]:
        """Refresh current user session"""
        try:
            result = self.supabase.auth.refresh_session()
            logger.info("Session refreshed successfully")
            return {
                'success': True,
                'user': result.user,
                'session': result.session
            }
        except Exception as e:
            logger.error(f"Session refresh failed: {e}")
            return {'success': False, 'error': str(e)}